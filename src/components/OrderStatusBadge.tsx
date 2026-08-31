const STYLES: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  RELEASED: "bg-blue-100 text-blue-800",
  PACKED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-green-100 text-green-800",
};

const LABELS: Record<string, string> = {
  PENDING_REVIEW: "Pending review",
  RELEASED: "In progress",
  PACKED: "Packed",
  SHIPPED: "Shipped",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
