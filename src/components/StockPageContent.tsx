import { prisma } from "@/lib/db";
import { AddStockForm } from "@/components/AddStockForm";
import { StockGrid } from "@/components/StockGrid";

export async function StockPageContent() {
  const [inStock, removed] = await Promise.all([
    prisma.stockItem.findMany({
      where: { status: "IN_STOCK" },
      include: { addedBy: { select: { email: true } } },
      orderBy: { addedAt: "desc" },
    }),
    prisma.stockItem.findMany({
      where: { status: "REMOVED" },
      include: { addedBy: { select: { email: true } }, removedBy: { select: { email: true } } },
      orderBy: { removedAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Stock</h1>

      <div className="mb-6 rounded-lg border-2 border-accent bg-accent-soft px-4 py-3 text-sm text-zinc-800">
        <p className="font-bold">📦 What is this for?</p>
        <p className="mt-1">
          Sometimes an order gets cancelled after the garment has already arrived. If a garment in a received
          parcel doesn&apos;t match any order in <strong>In progress</strong>, put it in stock instead of throwing
          it away — upload a photo below. Remove it once it&apos;s dealt with (sold, reused, or given away).
        </p>
      </div>

      <div className="mb-6">
        <AddStockForm />
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Currently in stock</h2>
          <span className="text-sm text-zinc-500">{inStock.length} item{inStock.length === 1 ? "" : "s"}</span>
        </div>
        <StockGrid items={inStock} removable />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">History (removed)</h2>
        <StockGrid items={removed} removable={false} />
      </div>
    </div>
  );
}
