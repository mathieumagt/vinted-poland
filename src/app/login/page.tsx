import { redirect } from "next/navigation";
import { getSession, homeForRole } from "@/lib/auth/guards";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-xl font-semibold text-zinc-900">Vinted Poland</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">Fulfillment workflow tracker</p>
        <LoginForm />
      </div>
    </div>
  );
}
