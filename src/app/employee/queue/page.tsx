import { prisma } from "@/lib/db";
import { OrderCard } from "@/components/OrderCard";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function EmployeeQueuePage() {
  const orders = await prisma.order.findMany({
    where: { localStatus: "RELEASED" },
    select: {
      id: true,
      title: true,
      trackingCode: true,
      shippingLabelUrl: true,
      note: true,
      items: { select: { id: true, title: true, thumbnailUrl: true } },
    },
    orderBy: { releasedAt: "asc" },
  });

  return (
    <div>
      <AutoRefresh />
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">In progress</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Match each garment to its photo and shipping label, pack it, then mark it as shipped.
      </p>

      {orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">Nothing to pack right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
