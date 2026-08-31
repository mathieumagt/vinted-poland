import { prisma } from "@/lib/db";
import { getEmployeeBalanceCents, formatEuros } from "@/lib/earnings";
import { MarkAsPaidButton } from "@/components/MarkAsPaidButton";
import { PaymentHistoryTable } from "@/components/PaymentHistoryTable";
import { Card, CardBody } from "@/components/ui/Card";

export default async function AdminPaymentsPage() {
  const [balanceCents, payments] = await Promise.all([
    getEmployeeBalanceCents(),
    prisma.payment.findMany({ orderBy: { paidAt: "desc" }, include: { markedBy: { select: { email: true } } } }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Employee payments</h1>
      <p className="mb-6 text-sm text-zinc-500">€2.00 per shipped parcel, since the last payout.</p>

      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">Current balance</p>
            <p className="text-2xl font-bold text-green-700">{formatEuros(balanceCents)}</p>
          </div>
          {balanceCents > 0 && <MarkAsPaidButton balanceLabel={formatEuros(balanceCents)} />}
        </CardBody>
      </Card>

      <h2 className="mb-3 text-sm font-medium text-zinc-500">History</h2>
      <PaymentHistoryTable payments={payments} />
    </div>
  );
}
