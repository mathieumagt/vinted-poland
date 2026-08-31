"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LabelViewer } from "@/components/LabelViewer";
import { ZoomableImage } from "@/components/ZoomableImage";

type OrderItem = { id: string; title: string; thumbnailUrl: string | null };

type Order = {
  id: string;
  title: string;
  trackingCode: string | null;
  shippingLabelUrl: string | null;
  note: string | null;
  items: OrderItem[];
};

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [note, setNote] = useState(order.note ?? "");
  const [noteOpen, setNoteOpen] = useState(Boolean(order.note));
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
    <Card className="overflow-hidden">
      <CardHeader className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium leading-snug text-zinc-900">{order.title}</h3>
          {order.trackingCode && <p className="mt-0.5 text-xs text-zinc-400">Ref: {order.trackingCode}</p>}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className={`grid gap-2 ${order.items.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}>
          {order.items.map((item) =>
            item.thumbnailUrl ? (
              <div key={item.id} className={order.items.length > 1 ? "aspect-square" : "aspect-[4/3]"}>
                <ZoomableImage
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full rounded-lg border border-zinc-200 bg-zinc-50 object-cover cursor-zoom-in"
                />
              </div>
            ) : (
              <div
                key={item.id}
                className={`flex w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400 ${
                  order.items.length > 1 ? "aspect-square" : "aspect-[4/3]"
                }`}
              >
                No photo
              </div>
            )
          )}
        </div>

        <LabelViewer orderId={order.id} hasLabel={Boolean(order.shippingLabelUrl)} />

        <div>
          {noteOpen ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              rows={2}
              autoFocus
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              placeholder="Missing item, damage, etc."
            />
          ) : (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="text-sm text-zinc-400 hover:text-zinc-600"
            >
              + Add a note
            </button>
          )}
          {savingNote && <p className="mt-1 text-xs text-zinc-400">Saving…</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-zinc-400">
          Only click once the parcel is packed and ready to go — this also marks the order as
          packed on DOTB and can&apos;t be undone.
        </p>
        <Button onClick={markShipped} disabled={shipping} className="w-full">
          {shipping ? "Marking as shipped…" : "Mark as shipped"}
        </Button>
      </CardBody>
    </Card>
  );
}
