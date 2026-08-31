import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LabelViewer } from "@/components/LabelViewer";
import { ReleaseButton } from "@/components/ReleaseButton";
import { RetryDotbPackButton } from "@/components/RetryDotbPackButton";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

function formatDateTime(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      account: true,
      releasedBy: true,
      packedBy: true,
      shippedBy: true,
      createdBy: true,
      activityLogs: { orderBy: { createdAt: "desc" }, include: { user: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-zinc-900">{order.title}</h1>
            <OrderStatusBadge status={order.localStatus} />
          </div>
          <p className="text-sm text-zinc-500">
            {order.source === "DOTB" ? `Synced from DOTB${order.account ? ` · ${order.account.login}` : ""}` : "Manual order"}
            {order.source === "MANUAL" && (
              <>
                {" · "}
                <Link href={`/admin/orders/${order.id}/edit`} className="underline">
                  Edit
                </Link>
              </>
            )}
          </p>
        </div>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Items ({order.items.length})</CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {order.items.map((item) => (
              <div key={item.id} className="text-sm">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="mb-1 aspect-square w-full rounded-md border border-zinc-200 object-cover"
                  />
                ) : (
                  <div className="mb-1 flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-zinc-300 text-xs text-zinc-400">
                    No photo
                  </div>
                )}
                <p className="font-medium text-zinc-800">{item.title}</p>
                {item.sku && <p className="text-xs text-zinc-400">SKU: {item.sku}</p>}
              </div>
            ))}
            {order.items.length === 0 && <p className="text-sm text-zinc-400">No items recorded.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Shipping label</CardHeader>
          <CardBody>
            <LabelViewer url={order.shippingLabelUrl} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Activity</CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {order.activityLogs.map((log) => (
                <li key={log.id} className="flex justify-between text-zinc-600">
                  <span>
                    {log.action.replaceAll("_", " ").toLowerCase()}
                    {log.user && <span className="text-zinc-400"> · {log.user.email}</span>}
                  </span>
                  <span className="text-zinc-400">{formatDateTime(log.createdAt)}</span>
                </li>
              ))}
              {order.activityLogs.length === 0 && <p className="text-zinc-400">No activity yet.</p>}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="font-medium text-zinc-900">Buyer</CardHeader>
          <CardBody className="space-y-1 text-sm text-zinc-600">
            <p>{order.buyerName || order.buyerLogin || "—"}</p>
            {order.buyerLogin && <p className="text-zinc-400">@{order.buyerLogin}</p>}
            {order.buyerCountryCode && <p>{order.buyerCountryCode}</p>}
            {order.trackingCode && <p>Tracking: {order.trackingCode}</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Timeline</CardHeader>
          <CardBody className="space-y-2 text-sm text-zinc-600">
            <p>Order date: {formatDateTime(order.orderDate)}</p>
            <p>Deadline: {formatDateTime(order.shippingDeadlineDate)}</p>
            <p>
              Released: {formatDateTime(order.releasedAt)}
              {order.releasedBy && <span className="text-zinc-400"> · {order.releasedBy.email}</span>}
            </p>
            <p>
              Shipped: {formatDateTime(order.shippedAt)}
              {order.shippedBy && <span className="text-zinc-400"> · {order.shippedBy.email}</span>}
            </p>
          </CardBody>
        </Card>

        {order.note && (
          <Card>
            <CardHeader className="font-medium text-zinc-900">Note from employee</CardHeader>
            <CardBody className="text-sm text-zinc-600">{order.note}</CardBody>
          </Card>
        )}

        {order.source === "DOTB" && order.dotbPackSyncStatus === "failed" && (
          <Card>
            <CardHeader className="font-medium text-red-700">DOTB sync failed</CardHeader>
            <CardBody className="space-y-2 text-sm text-zinc-600">
              <p className="text-red-600">{order.dotbPackSyncError}</p>
              <RetryDotbPackButton orderId={order.id} />
            </CardBody>
          </Card>
        )}

        {order.localStatus === "PENDING_REVIEW" && (
          <Card>
            <CardBody>
              <ReleaseButton orderId={order.id} />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
