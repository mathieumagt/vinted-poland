"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LabelViewer } from "@/components/LabelViewer";

type OrderItem = { id: string; title: string; thumbnailUrl: string | null; sku: string | null };

type Order = {
  id: string;
  title: string;
  buyerName: string | null;
  buyerLogin: string | null;
  buyerCountryCode: string | null;
  shippingLabelUrl: string | null;
  note: string | null;
  items: OrderItem[];
};

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [note, setNote] = useState(order.note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveNote() {
    setSavingNote(true);
    try {
      await fetch(`/api/orders/${order.id}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
    } finally {
      setSavingNote(false);
    }
  }

  async function markShipped() {
    setShipping(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/ship`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not mark as shipped.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setShipping(false);
    }
  }

  return (
    <Card>
      <CardHeader className="font-medium text-zinc-900">{order.title}</CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {order.items.map((item) => (
            <div key={item.id} className="text-xs">
              {item.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="mb-1 aspect-square w-full rounded-md border border-zinc-200 object-cover"
                />
              ) : (
                <div className="mb-1 flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-zinc-300 text-zinc-400">
                  No photo
                </div>
              )}
              <p className="truncate text-zinc-700">{item.title}</p>
            </div>
          ))}
        </div>

        <div className="text-sm text-zinc-600">
          Buyer: {order.buyerName || order.buyerLogin || "—"}
          {order.buyerCountryCode && <span className="ml-1 text-zinc-400">({order.buyerCountryCode})</span>}
        </div>

        <LabelViewer url={order.shippingLabelUrl} />

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Note (missing item, damage, etc.)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            rows={2}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
            placeholder="Optional note visible to the admin"
          />
          {savingNote && <p className="mt-1 text-xs text-zinc-400">Saving…</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={markShipped} disabled={shipping} className="w-full">
          {shipping ? "Marking as shipped…" : "Mark as shipped"}
        </Button>
      </CardBody>
    </Card>
  );
}
