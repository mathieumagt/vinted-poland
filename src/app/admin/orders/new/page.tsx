import { ManualOrderForm } from "@/components/forms/ManualOrderForm";

export default function NewOrderPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">New manual order</h1>
      <p className="mb-6 text-sm text-zinc-500">
        For orders outside DOTB (account not connected yet, edge cases). The order starts as Pending review.
      </p>
      <ManualOrderForm />
    </div>
  );
}
