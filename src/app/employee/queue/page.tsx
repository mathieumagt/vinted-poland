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
    orderBy: { orderDate: "asc" },
  });

  return (
    <div>
      <AutoRefresh />

      <div className="mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3">
        <p className="text-base font-bold text-amber-900">
          ⚠ Remove ALL Shein tags before shipping
        </p>
        <p className="text-sm text-amber-800">
          There can be more than one tag per item — check the collar AND the waist/hips.
        </p>
      </div>

      <h1 className="mb-1 text-xl font-semibold text-zinc-900">In progress</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Match each garment to its photo and shipping label, pack it, then mark it as shipped. Oldest orders first.
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
