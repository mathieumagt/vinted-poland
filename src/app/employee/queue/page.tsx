import { prisma } from "@/lib/db";
import { OrderCard } from "@/components/OrderCard";

export default async function EmployeeQueuePage() {
  const orders = await prisma.order.findMany({
    where: { localStatus: "RELEASED" },
    include: { items: true },
    orderBy: { releasedAt: "asc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">In progress</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Match each garment to its photo and shipping label, pack it, then mark it as shipped.
      </p>

      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">Nothing to pack right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
