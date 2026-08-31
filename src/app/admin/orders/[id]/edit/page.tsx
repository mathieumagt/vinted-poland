import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EditOrderForm } from "@/components/forms/EditOrderForm";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.source !== "MANUAL") notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Edit order</h1>
      <EditOrderForm order={order} />
    </div>
  );
}
