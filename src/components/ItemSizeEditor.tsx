"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ItemSizeEditor({
  orderId,
  itemId,
  initialSize,
}: {
  orderId: string;
  itemId: string;
  initialSize: string | null;
}) {
  const router = useRouter();
  const [size, setSize] = useState(initialSize ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (size === (initialSize ?? "")) return;
    setSaving(true);
    try {
      await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      type="text"
      value={size}
      onChange={(e) => setSize(e.target.value)}
      onBlur={save}
      placeholder="Size (e.g. M)"
      disabled={saving}
      className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent-soft"
    />
  );
}
