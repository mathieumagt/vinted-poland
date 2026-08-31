"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type Account = {
  id: string;
  login: string;
  country: string | null;
  bridgeConnected: boolean;
  enabled: boolean;
  lastSyncedAt: Date | string | null;
};

export function AccountsClient({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts/refresh", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not refresh from DOTB.");
        return;
      }
      setAccounts(body.data);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setRefreshing(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    setTogglingId(id);
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a)));
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between font-medium text-zinc-900">
        <span>Connected Vinted accounts</span>
        <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh from DOTB"}
        </Button>
      </CardHeader>
      <CardBody>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {accounts.length === 0 && (
          <p className="text-sm text-zinc-500">No accounts yet — click &quot;Refresh from DOTB&quot; to fetch them.</p>
        )}
        {accounts.length > 0 && (
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
                    className="h-4 w-4 accent-accent"
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
