import { prisma } from "@/lib/db";

export const EARNINGS_PER_PARCEL_CENTS = 200; // 2.00 EUR per shipped parcel

// No live FX feed is wired up — this is a fixed, approximate rate for the
// "about how much in zloty" summary, not a source of truth for accounting.
export const EUR_TO_PLN_RATE = 4.3;

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

export function formatZloty(cents: number): string {
  return `${((cents / 100) * EUR_TO_PLN_RATE).toFixed(2)} zł`;
}

/** Lifetime totals (not reset by payouts), for the payments-page summary. */
export async function getLifetimeStats(): Promise<{ totalShipped: number; totalEarnedCents: number }> {
  const totalShipped = await prisma.order.count({
    where: { localStatus: "SHIPPED", shippedBy: { role: "EMPLOYEE" } },
  });
  return { totalShipped, totalEarnedCents: totalShipped * EARNINGS_PER_PARCEL_CENTS };
}
