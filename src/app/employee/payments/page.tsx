import { prisma } from "@/lib/db";
import { getEmployeeBalanceCents, getLifetimeStats, formatEuros, formatZloty } from "@/lib/earnings";
import { PaymentHistoryTable } from "@/components/PaymentHistoryTable";
import { Card, CardBody } from "@/components/ui/Card";

export default async function EmployeePaymentsPage() {
  const [balanceCents, lifetime, payments] = await Promise.all([
    getEmployeeBalanceCents(),
    getLifetimeStats(),
    prisma.payment.findMany({ orderBy: { paidAt: "desc" }, include: { markedBy: { select: { email: true } } } }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Payments</h1>
      <p className="mb-6 text-sm text-zinc-500">€2.00 per shipped parcel, since the last payout.</p>

      <Card className="mb-6">
        <CardBody>
          <p className="text-sm text-zinc-500">Current balance</p>
          <p className="text-2xl font-bold text-green-700">{formatEuros(balanceCents)}</p>
        </CardBody>
      </Card>

      <h2 className="mb-3 text-sm font-medium text-zinc-500">Lifetime summary</h2>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardBody>
            <p className="text-xs text-zinc-500">Parcels shipped</p>
            <p className="text-lg font-bold text-zinc-900">{lifetime.totalShipped}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-zinc-500">Total earned</p>
            <p className="text-lg font-bold text-zinc-900">{formatEuros(lifetime.totalEarnedCents)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-zinc-500">≈ in zloty</p>
            <p className="text-lg font-bold text-zinc-900">{formatZloty(lifetime.totalEarnedCents)}</p>
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-medium text-zinc-500">History</h2>
      <PaymentHistoryTable payments={payments} />
    </div>
  );
}
