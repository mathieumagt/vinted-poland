import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Prisma } from "@prisma/client";

/** Exactly the fields OrderTable renders — pass to `select` so list queries don't
 * pull financial/buyer data (or Decimal fields, which can't cross into Client Components). */
export const orderRowSelect = {
  id: true,
  title: true,
  orderDate: true,
  itemCount: true,
  localStatus: true,
  source: true,
  trackingCode: true,
  shippedAt: true,
  account: { select: { login: true } },
  items: { select: { thumbnailUrl: true }, take: 1 },
} satisfies Prisma.OrderSelect;

export type OrderRow = {
  id: string;
  title: string;
  orderDate: Date | null;
  itemCount: number | null;
  localStatus: string;
  source: string;
  trackingCode: string | null;
  shippedAt: Date | null;
  account?: { login: string } | null;
  items: { thumbnailUrl: string | null }[];
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function OrderTable({ orders, basePath, dateLabel = "Order date" }: { orders: OrderRow[]; basePath: string; dateLabel?: string }) {
  if (orders.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-400">No orders here.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-100 text-sm">
        <thead className="bg-zinc-50/80 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">{dateLabel}</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((order) => {
            const thumbnail = order.items[0]?.thumbnailUrl;
            return (
              <tr key={order.id} className="hover:bg-zinc-50">
                <td className="px-4 py-2.5">
                  <Link href={`${basePath}/${order.id}`} className="flex items-center gap-3 group">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-md border border-zinc-200 object-cover" />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-dashed border-zinc-300 text-[10px] text-zinc-400">
                        No photo
                      </span>
                    )}
                    <span>
                      <span className="font-medium text-zinc-900 group-hover:text-accent">{order.title}</span>
                      {order.trackingCode && <div className="text-xs text-zinc-400">Ref: {order.trackingCode}</div>}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{order.account?.login ?? (order.source === "MANUAL" ? "Manual" : "—")}</td>
                <td className="px-4 py-2.5 text-zinc-600">{order.itemCount ?? "—"}</td>
                <td className="px-4 py-2.5 text-zinc-600">
                  {dateLabel === "Shipped" ? formatDate(order.shippedAt) : formatDate(order.orderDate)}
                </td>
                <td className="px-4 py-2.5">
                  <OrderStatusBadge status={order.localStatus} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
