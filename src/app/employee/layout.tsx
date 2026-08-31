import { requireAnyRole } from "@/lib/auth/guards";
import { Nav } from "@/components/Nav";

const LINKS = [
  { href: "/employee/queue", label: "In progress" },
  { href: "/employee/shipped", label: "Shipped" },
  { href: "/employee/history", label: "History" },
];

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAnyRole(["EMPLOYEE", "ADMIN"]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav links={LINKS} email={session.email} role={session.role} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
