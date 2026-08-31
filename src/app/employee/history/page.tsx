import { prisma } from "@/lib/db";
import { OrderTable, orderRowSelect } from "@/components/OrderTable";
import type { Prisma } from "@prisma/client";

export default async function EmployeeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim();

  const where: Prisma.OrderWhereInput = {
    localStatus: "SHIPPED",
    ...(q
      ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { trackingCode: { contains: q, mode: "insensitive" } }] }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    select: orderRowSelect,
    orderBy: { shippedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">History</h1>
          <p className="text-sm text-zinc-500">Full archive of shipped orders.</p>
        </div>
        <form>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title or tracking ref…"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </form>
      </div>
      <OrderTable orders={orders} basePath="/employee/history" dateLabel="Shipped" />
    </div>
  );
}
