"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function MarkAsPaidButton({ balanceLabel }: { balanceLabel: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(`Mark ${balanceLabel} as paid to the employee? This resets the balance to €0.00.`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not record the payment.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Marking as paid…" : "Mark as paid"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
