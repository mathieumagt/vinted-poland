import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/auth/guards";
import { LoginForm } from "./LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <p className="mb-1 text-center text-4xl font-extrabold tracking-widest text-accent">MAGT</p>
        <h1 className="mb-1 text-center text-xl font-semibold text-zinc-900">Vinted Poland</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">Fulfillment workflow tracker</p>
        <LoginForm />
      </div>
    </div>
  );
}
