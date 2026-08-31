import { prisma } from "@/lib/db";
import { OrderTable } from "@/components/OrderTable";
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
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { buyerName: { contains: q, mode: "insensitive" } },
            { buyerLogin: { contains: q, mode: "insensitive" } },
            { trackingCode: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    include: { account: true },
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
            placeholder="Search title, buyer, tracking…"
            className="w-64 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </form>
      </div>
      <OrderTable orders={orders} basePath="/employee/history" dateLabel="Shipped" />
    </div>
  );
}
