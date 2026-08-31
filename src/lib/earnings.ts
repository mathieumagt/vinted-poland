import { prisma } from "@/lib/db";

export const EARNINGS_PER_PARCEL_CENTS = 200; // 2.00 EUR per shipped parcel

/** Parcels shipped since the last payout was marked (or ever, if none yet). */
export async function getUnpaidParcelCount(): Promise<number> {
  const lastPayment = await prisma.payment.findFirst({ orderBy: { paidAt: "desc" }, select: { paidAt: true } });

  return prisma.order.count({
    where: {
      localStatus: "SHIPPED",
      shippedBy: { role: "EMPLOYEE" },
      ...(lastPayment ? { shippedAt: { gt: lastPayment.paidAt } } : {}),
    },
  });
}

export async function getEmployeeBalanceCents(): Promise<number> {
  const count = await getUnpaidParcelCount();
  return count * EARNINGS_PER_PARCEL_CENTS;
}

export function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
