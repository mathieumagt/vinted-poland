import { requireRole } from "@/lib/auth/guards";
import { Nav } from "@/components/Nav";
import { getEmployeeBalanceCents, formatEuros } from "@/lib/earnings";

const LINKS = [
  { href: "/admin/dashboard", label: "Pending review" },
  { href: "/admin/orders", label: "All orders" },
  { href: "/admin/orders/new", label: "New order" },
  { href: "/admin/settings/accounts", label: "Vinted accounts" },
  { href: "/admin/payments", label: "Payments" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN");
  const balanceCents = await getEmployeeBalanceCents();

  return (
    <div className="min-h-screen bg-background">
      <Nav links={LINKS} email={session.email} role={session.role} balance={formatEuros(balanceCents)} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
