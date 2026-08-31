import { formatEuros } from "@/lib/earnings";

export type PaymentRow = {
  id: string;
  amountCents: number;
  parcelCount: number;
  note: string | null;
  paidAt: Date;
  markedBy: { email: string } | null;
};

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function PaymentHistoryTable({ payments }: { payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return <p className="py-10 text-center text-sm text-zinc-400">No payments recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-100 text-sm">
        <thead className="bg-zinc-50/80 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Parcels</th>
            <th className="px-4 py-3">Marked by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-4 py-2.5 text-zinc-600">{formatDateTime(payment.paidAt)}</td>
              <td className="px-4 py-2.5 font-semibold text-green-700">{formatEuros(payment.amountCents)}</td>
              <td className="px-4 py-2.5 text-zinc-600">{payment.parcelCount}</td>
              <td className="px-4 py-2.5 text-zinc-500">{payment.markedBy?.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
