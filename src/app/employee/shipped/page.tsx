import { prisma } from "@/lib/db";
import { OrderTable } from "@/components/OrderTable";
import { daysAgo } from "@/lib/dates";

export default async function EmployeeShippedPage() {
  const sevenDaysAgo = daysAgo(7);

  const orders = await prisma.order.findMany({
    where: { localStatus: "SHIPPED", shippedAt: { gte: sevenDaysAgo } },
    include: { account: true },
    orderBy: { shippedAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Shipped (last 7 days)</h1>
      <p className="mb-6 text-sm text-zinc-500">Quick check of what you&apos;ve recently sent out.</p>
      <OrderTable orders={orders} basePath="/employee/history" dateLabel="Shipped" />
    </div>
  );
}
