import { AccountsClient } from "./AccountsClient";

export default function AccountSettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Vinted accounts</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Choose which of your DOTB-connected Vinted accounts should be synced into this app. Only enabled
        accounts&apos; orders will show up in Pending review.
      </p>
      <AccountsClient />
    </div>
  );
}
