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
      items: { select: { id: true, title: true, size: true, thumbnailUrl: true } },
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

      <div className="mb-6 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        <p className="mb-1 font-medium text-zinc-800">How this works</p>
        <p>
          When a Shein parcel arrives, open it and match each garment inside to its photo below to find the right
          order. Then pack it using that order&apos;s shipping label, and mark it as shipped.
        </p>
        <p className="mt-1">
          Orders below are sorted <strong>oldest to newest</strong> — the most urgent ones are at the top, so work
          through them in that order. But if you can&apos;t find the order for a garment you&apos;ve received, don&apos;t
          hesitate to scroll further down the list.
        </p>
      </div>

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
