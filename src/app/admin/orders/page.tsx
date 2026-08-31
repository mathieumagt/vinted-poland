import Link from "next/link";
import { prisma } from "@/lib/db";
import { OrderTable } from "@/components/OrderTable";
import type { LocalStatus, Prisma } from "@prisma/client";

const STATUS_TABS: { value: LocalStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "RELEASED", label: "In progress" },
  { value: "SHIPPED", label: "Shipped" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = STATUS_TABS.some((t) => t.value === params.status) ? (params.status as LocalStatus | "ALL") : "ALL";
  const q = params.q?.trim();

  const where: Prisma.OrderWhereInput = {
    ...(status !== "ALL" ? { localStatus: status } : {}),
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
    orderBy: { orderDate: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">All orders</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => {
            const href = tab.value === "ALL" ? "/admin/orders" : `/admin/orders?status=${tab.value}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  status === tab.value ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <form className="flex gap-2">
          {status !== "ALL" && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search title, buyer, tracking…"
            className="w-64 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </form>
      </div>

      <OrderTable orders={orders} basePath="/admin/orders" />
    </div>
  );
}
