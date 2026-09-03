import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LabelViewer } from "@/components/LabelViewer";
import { ReleaseButton } from "@/components/ReleaseButton";
import { RetryDotbPackButton } from "@/components/RetryDotbPackButton";
import { ItemSizeEditor } from "@/components/ItemSizeEditor";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatOrderTitle } from "@/lib/orderTitle";

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
      shippedBy: true,
      activityLogs: { orderBy: { createdAt: "desc" }, include: { user: true }, take: 20 },
    },
  });
  if (!order) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <h1 className="text-xl font-semibold text-zinc-900">{formatOrderTitle(order.title)}</h1>
              <OrderStatusBadge status={order.localStatus} />
            </div>
            <p className="text-sm text-zinc-500">
              {order.source === "DOTB" ? `Synced from DOTB${order.account ? ` · ${order.account.login}` : ""}` : "Manual order"}
              {order.trackingCode && ` · Ref: ${order.trackingCode}`}
              {order.source === "MANUAL" && (
                <>
                  {" · "}
                  <Link href={`/admin/orders/${order.id}/edit`} className="text-accent hover:underline">
                    Edit
                  </Link>
                </>
              )}
            </p>
          </div>
          {order.localStatus === "PENDING_REVIEW" && order.source === "MANUAL" && <ReleaseButton orderId={order.id} />}
          {order.localStatus === "PENDING_REVIEW" && order.source === "DOTB" && (
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-500">
              Waiting for DOTB to send the shipping label…
            </span>
          )}
        </div>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Photos ({order.items.length})</CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {order.items.map((item) => (
              <div key={item.id} className="text-sm">
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="mb-1.5 aspect-square w-full rounded-lg border border-zinc-200 object-cover"
                  />
                ) : (
                  <div className="mb-1.5 flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400">
                    No photo
                  </div>
                )}
                <p className="text-zinc-600">{item.title}</p>
                <ItemSizeEditor orderId={order.id} itemId={item.id} initialSize={item.size} />
              </div>
            ))}
            {order.items.length === 0 && <p className="text-sm text-zinc-400">No items recorded.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Shipping label</CardHeader>
          <CardBody>
            <LabelViewer orderId={order.id} hasLabel={Boolean(order.shippingLabelUrl)} />
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="font-medium text-zinc-900">Timeline</CardHeader>
          <CardBody className="space-y-2 text-sm text-zinc-600">
            {order.shippingDeadlineDate && <p>Deadline: {formatDateTime(order.shippingDeadlineDate)}</p>}
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

        <Card>
          <CardHeader className="text-sm font-medium text-zinc-500">Activity</CardHeader>
          <CardBody>
            <ul className="space-y-2 text-xs">
              {order.activityLogs.map((log) => (
                <li key={log.id} className="flex justify-between text-zinc-500">
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
    </div>
  );
}
