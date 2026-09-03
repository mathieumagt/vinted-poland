import Link from "next/link";
import { prisma } from "@/lib/db";
import { OrderCard } from "@/components/OrderCard";
import { AutoRefresh } from "@/components/AutoRefresh";
import { SyncButton } from "@/components/SyncButton";

const STEPS = [
  { title: "Receive the parcel", body: "A Shein parcel arrives with several garments inside." },
  { title: "Match to a photo", body: "Find the item's order below by matching it to its photo." },
  { title: "Remove Shein tags", body: "Cut off every tag — collar and waist/hips, there can be more than one." },
  { title: "Pack & ship", body: "Pack it with that order's label, then click \"Mark as shipped\"." },
];

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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-accent bg-accent-soft px-4 py-3">
        <p className="text-sm font-medium text-zinc-800">
          📦 Just received a Shein parcel? Click <strong>Sync now</strong> to pull in the latest orders.
        </p>
        <SyncButton />
      </div>

      <div className="mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 px-4 py-3">
        <p className="text-base font-bold text-amber-900">⚠ Remove ALL Shein tags before shipping</p>
        <p className="text-sm text-amber-800">
          There can be more than one tag per item — check the collar AND the waist/hips.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-green-400 bg-green-50 px-4 py-3">
        <div>
          <p className="text-base font-bold text-green-900">🏷 Garment not in any order below?</p>
          <p className="text-sm text-green-800">
            Even after scrolling all the way down — if it&apos;s not there, the order was probably cancelled after
            the parcel arrived. Don&apos;t throw it away: take a photo and add it in the <strong>Stock</strong> tab.
          </p>
        </div>
        <Link
          href="/employee/stock"
          className="shrink-0 rounded-lg border border-green-600 bg-white px-3 py-1.5 text-sm font-medium text-green-800 hover:bg-green-100"
        >
          Go to Stock
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {i + 1}
            </div>
            <p className="text-sm font-medium text-zinc-800">{step.title}</p>
            <p className="text-xs text-zinc-500">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900">In progress</h1>
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-right shadow-sm">
          <p className="text-2xl font-bold text-accent">{orders.length}</p>
          <p className="text-xs text-zinc-500">order{orders.length === 1 ? "" : "s"} to ship</p>
        </div>
      </div>

      <p className="mb-6 text-sm text-zinc-500">
        Orders below are sorted <strong>oldest to newest</strong> — the most urgent ones are at the top, so work
        through them in that order. But if you can&apos;t find the order for a garment you&apos;ve received, don&apos;t
        hesitate to scroll further down the list.
      </p>

      {orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">Nothing to pack right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
