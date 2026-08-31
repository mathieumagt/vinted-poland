"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type Account = {
  id: string;
  login: string;
  country: string | null;
  bridgeConnected: boolean;
  enabled: boolean;
  lastSyncedAt: string | null;
};

export function AccountsClient() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/accounts");
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not load Vinted accounts.");
        return;
      }
      setAccounts(body.data);
    } catch {
      setError("Could not reach the server. Check DOTB_API_TOKEN is configured.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial client-side data fetch on mount
    load();
  }, []);

  async function toggle(id: string, enabled: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setAccounts((prev) => prev?.map((a) => (a.id === id ? { ...a, enabled } : a)) ?? null);
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between font-medium text-zinc-900">
        <span>Connected Vinted accounts</span>
        <Button variant="secondary" size="sm" onClick={load}>
          Refresh from DOTB
        </Button>
      </CardHeader>
      <CardBody>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {!accounts && !error && <p className="text-sm text-zinc-500">Loading…</p>}
        {accounts && accounts.length === 0 && (
          <p className="text-sm text-zinc-500">No connected Vinted accounts found in DOTB.</p>
        )}
        {accounts && accounts.length > 0 && (
          <ul className="divide-y divide-zinc-100">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-zinc-800">
                    {account.login}
                    {account.country && <span className="ml-1 text-zinc-400">({account.country})</span>}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {account.bridgeConnected ? "Extension connected" : "Extension offline"}
                    {account.lastSyncedAt && ` · last synced ${new Date(account.lastSyncedAt).toLocaleString("en-GB")}`}
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <span className="text-zinc-500">{account.enabled ? "Syncing" : "Not syncing"}</span>
                  <input
                    type="checkbox"
                    checked={account.enabled}
                    disabled={togglingId === account.id}
                    onChange={(e) => toggle(account.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
