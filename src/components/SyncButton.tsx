"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Sync failed.");
        return;
      }
      setMessage(`Synced ${body.data.ordersSynced} order(s) from ${body.data.accountCount} account(s).`);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing}>
        {syncing ? "Syncing…" : "Sync now"}
      </Button>
      {message && <span className="text-sm text-green-700">{message}</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
