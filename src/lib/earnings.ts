import { prisma } from "@/lib/db";

export const EARNINGS_PER_PARCEL_CENTS = 200; // 2.00 EUR per shipped parcel

/** Running total across everything the employee (or employees) has shipped so far. */
export async function getEmployeeBalanceCents(): Promise<number> {
  const shippedCount = await prisma.order.count({
    where: { localStatus: "SHIPPED", shippedBy: { role: "EMPLOYEE" } },
  });
  return shippedCount * EARNINGS_PER_PARCEL_CENTS;
}

export function formatEuros(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
