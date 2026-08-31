import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LabelViewer } from "@/components/LabelViewer";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

function formatDateTime(date: Date | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function EmployeeOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, account: true, shippedBy: true },
  });
  if (!order) notFound();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900">{order.title}</h1>
          <OrderStatusBadge status={order.localStatus} />
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
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="font-medium text-zinc-900">Shipping label</CardHeader>
          <CardBody>
            <LabelViewer url={order.shippingLabelUrl} />
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="font-medium text-zinc-900">Buyer</CardHeader>
          <CardBody className="space-y-1 text-sm text-zinc-600">
            <p>{order.buyerName || order.buyerLogin || "—"}</p>
            {order.trackingCode && <p>Tracking: {order.trackingCode}</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="font-medium text-zinc-900">Timeline</CardHeader>
          <CardBody className="space-y-2 text-sm text-zinc-600">
            <p>
              Shipped: {formatDateTime(order.shippedAt)}
              {order.shippedBy && <span className="text-zinc-400"> · {order.shippedBy.email}</span>}
            </p>
          </CardBody>
        </Card>
        {order.note && (
          <Card>
            <CardHeader className="font-medium text-zinc-900">Note</CardHeader>
            <CardBody className="text-sm text-zinc-600">{order.note}</CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
