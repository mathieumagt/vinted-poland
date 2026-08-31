import Link from "next/link";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

export type OrderRow = {
  id: string;
  title: string;
  buyerName: string | null;
  buyerLogin: string | null;
  buyerCountryCode: string | null;
  orderDate: Date | null;
  shippingDeadlineDate: Date | null;
  itemCount: number | null;
  localStatus: string;
  source: string;
  trackingCode: string | null;
  shippedAt: Date | null;
  account?: { login: string } | null;
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function OrderTable({ orders, basePath, dateLabel = "Order date" }: { orders: OrderRow[]; basePath: string; dateLabel?: string }) {
  if (orders.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No orders here.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">{dateLabel}</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link href={`${basePath}/${order.id}`} className="font-medium text-zinc-900 hover:underline">
                  {order.title}
                </Link>
                {order.trackingCode && <div className="text-xs text-zinc-400">Tracking: {order.trackingCode}</div>}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {order.buyerName || order.buyerLogin || "—"}
                {order.buyerCountryCode && <span className="ml-1 text-zinc-400">({order.buyerCountryCode})</span>}
              </td>
              <td className="px-4 py-3 text-zinc-600">{order.account?.login ?? (order.source === "MANUAL" ? "Manual" : "—")}</td>
              <td className="px-4 py-3 text-zinc-600">{order.itemCount ?? "—"}</td>
              <td className="px-4 py-3 text-zinc-600">
                {dateLabel === "Shipped" ? formatDate(order.shippedAt) : formatDate(order.orderDate)}
              </td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.localStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
