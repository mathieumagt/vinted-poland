/**
 * Runs once when the server process boots. In production on Vercel, order
 * syncing is driven by Vercel Cron hitting /api/cron/sync instead (a
 * setInterval wouldn't survive across serverless invocations there). Locally
 * (and on any traditional long-running Node host), this keeps orders flowing
 * to the employee queue on its own, without anyone clicking "Sync now".
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL) return;
  if (process.env.DISABLE_LOCAL_SYNC_LOOP === "1") return;

  const globalForSyncLoop = globalThis as unknown as { __vintedPolandSyncLoopStarted?: boolean };
  if (globalForSyncLoop.__vintedPolandSyncLoopStarted) return;
  globalForSyncLoop.__vintedPolandSyncLoopStarted = true;

  const intervalMinutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? "5");
  const { runSync } = await import("@/lib/dotb/sync");

  async function tick() {
    try {
      const result = await runSync();
      console.log(
        `[auto-sync] synced ${result.ordersSynced} order(s) from ${result.accountCount} account(s), ${result.autoReleased} released to the employee queue`
      );
    } catch (err) {
      console.error("[auto-sync] failed:", err instanceof Error ? err.message : err);
    }
  }

  setInterval(tick, intervalMinutes * 60 * 1000);
  setTimeout(tick, 10_000);
}
