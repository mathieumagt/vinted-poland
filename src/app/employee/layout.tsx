import { requireAnyRole } from "@/lib/auth/guards";
import { Nav } from "@/components/Nav";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getEmployeeBalanceCents, formatEuros } from "@/lib/earnings";

const LINKS = [
  { href: "/employee/queue", label: "In progress" },
  { href: "/employee/shipped", label: "Shipped" },
  { href: "/employee/history", label: "History" },
  { href: "/employee/payments", label: "Payments" },
  { href: "/employee/stock", label: "Stock" },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAnyRole(["EMPLOYEE", "ADMIN"]);
  const balanceCents = await getEmployeeBalanceCents();

  return (
    <div className="min-h-screen bg-background">
      <AutoRefresh />
      <Nav links={LINKS} email={session.email} role={session.role} balance={formatEuros(balanceCents)} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
