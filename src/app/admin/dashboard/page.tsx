import { prisma } from "@/lib/db";
import { OrderTable, orderRowSelect } from "@/components/OrderTable";
import { SyncButton } from "@/components/SyncButton";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function AdminDashboardPage() {
  const orders = await prisma.order.findMany({
    where: { localStatus: "PENDING_REVIEW" },
    select: orderRowSelect,
    orderBy: { orderDate: "desc" },
  });

  return (
    <div>
      <AutoRefresh />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Pending review</h1>
          <p className="text-sm text-zinc-500">
            Orders synced from DOTB (or added manually), waiting for the matching Shein parcel to arrive before
            being released to the employee.
          </p>
        </div>
        <SyncButton />
      </div>
      <OrderTable orders={orders} basePath="/admin/orders" />
    </div>
  );
}
