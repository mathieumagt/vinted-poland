import { prisma } from "@/lib/db";
import { AccountsClient } from "./AccountsClient";

export default async function AccountSettingsPage() {
  const accounts = await prisma.vintedAccountSelection.findMany({ orderBy: { login: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Vinted accounts</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Choose which of your DOTB-connected Vinted accounts should be synced into this app.
      </p>
      <AccountsClient initialAccounts={accounts} />
    </div>
  );
}
