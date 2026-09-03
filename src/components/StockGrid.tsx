"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZoomableImage } from "@/components/ZoomableImage";
import { Button } from "@/components/ui/Button";

export type StockItemRow = {
  id: string;
  title: string | null;
  note: string | null;
  photoUrl: string;
  addedAt: string | Date;
  addedBy: { email: string } | null;
  removedAt?: string | Date | null;
  removedBy?: { email: string } | null;
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StockCard({ item, removable }: { item: StockItemRow; removable: boolean }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!window.confirm("Remove this item from stock? (e.g. it was sold, reused, or given away)")) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/stock/${item.id}/remove`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-square">
        <ZoomableImage
          src={item.photoUrl}
          alt={item.title ?? "Stock item"}
          className="h-full w-full cursor-zoom-in object-cover"
        />
      </div>
      <div className="p-2.5">
        <p className="truncate text-sm font-medium text-zinc-800">{item.title || "Untitled item"}</p>
        {item.note && <p className="truncate text-xs text-zinc-500">{item.note}</p>}
        <p className="mt-1 text-xs text-zinc-400">
          {removable ? "Added" : "Removed"} {formatDate(removable ? item.addedAt : (item.removedAt ?? item.addedAt))}
          {(removable ? item.addedBy : item.removedBy)?.email
            ? ` · ${(removable ? item.addedBy : item.removedBy)!.email}`
            : ""}
        </p>
        {removable && (
          <Button variant="secondary" size="sm" onClick={handleRemove} disabled={removing} className="mt-2 w-full">
            {removing ? "Removing…" : "Remove from stock"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function StockGrid({ items, removable }: { items: StockItemRow[]; removable: boolean }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">Nothing here.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <StockCard key={item.id} item={item} removable={removable} />
      ))}
    </div>
  );
}
