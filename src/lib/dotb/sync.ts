import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activityLog";
import { listAccounts, listOrders } from "./client";
import type { DotbOrder } from "./types";
import type { Prisma } from "@prisma/client";

const PAGE_DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Refreshes the local VintedAccountSelection list from DOTB, preserving the admin's `enabled` choice. */
export async function syncAccounts(): Promise<{ synced: number }> {
  const { data } = await listAccounts();

  for (const account of data) {
    await prisma.vintedAccountSelection.upsert({
      where: { dotbAccountId: account.id },
      update: {
        login: account.login,
        vintedId: String(account.vinted_id),
        country: account.country,
        bridgeConnected: account.bridge.connected,
        bridgeLastSeenAt: toDateOrNull(account.bridge.last_seen_at),
      },
      create: {
        dotbAccountId: account.id,
        login: account.login,
        vintedId: String(account.vinted_id),
        country: account.country,
        bridgeConnected: account.bridge.connected,
        bridgeLastSeenAt: toDateOrNull(account.bridge.last_seen_at),
        enabled: false,
      },
    });
  }

  return { synced: data.length };
}

/** We only surface photo + shipping label to the two users, so the sync only pulls
 * item data (which carries the photo) — no buyer/financial fields are requested. */
async function upsertOrder(dotbOrder: DotbOrder, localAccountId: string | null) {
  const baseData = {
    source: "DOTB" as const,
    accountId: localAccountId,
    title: dotbOrder.title,
    dotbStatus: dotbOrder.normalized_status,
    orderDate: toDateOrNull(dotbOrder.order_date),
    shippingAddress: (dotbOrder.shipping_address ?? undefined) as Prisma.InputJsonValue | undefined,
    shippingLabelUrl: dotbOrder.shipping_label_url,
    shippingDeadlineDate: toDateOrNull(dotbOrder.shipping_deadline_date),
    trackingCode: dotbOrder.tracking_code,
    itemCount: dotbOrder.item_count ?? undefined,
  };

  const order = await prisma.order.upsert({
    where: { dotbOrderId: dotbOrder.id },
    update: baseData,
    create: {
      ...baseData,
      dotbOrderId: dotbOrder.id,
    },
  });

  await Promise.all(
    (dotbOrder.items ?? []).map((item) =>
      prisma.orderItem.upsert({
        where: { orderId_dotbItemId: { orderId: order.id, dotbItemId: item.id } },
        update: {
          title: item.title,
          thumbnailUrl: item.thumbnail_url,
          sku: item.sku,
        },
        create: {
          orderId: order.id,
          dotbItemId: item.id,
          title: item.title,
          thumbnailUrl: item.thumbnail_url,
          sku: item.sku,
        },
      })
    )
  );

  return order;
}

async function syncOrdersForAccount(account: { id: string; dotbAccountId: string }): Promise<number> {
  const windowDays = Number(process.env.SYNC_WINDOW_DAYS ?? "45");
  const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let cursor: string | undefined;
  let count = 0;

  do {
    const page = await listOrders({
      accountId: account.dotbAccountId,
      from,
      include: ["items"],
      limit: 100,
      cursor,
    });

    // Orders are independent of each other, so write them concurrently rather
    // than one DB round-trip at a time — this matters a lot under high-latency
    // connections (e.g. a Postgres provider in a different region).
    await Promise.all(page.data.map((dotbOrder) => upsertOrder(dotbOrder, account.id)));
    count += page.data.length;

    cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined;
    if (cursor) await sleep(PAGE_DELAY_MS);
  } while (cursor);

  await prisma.vintedAccountSelection.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return count;
}

/** Pulls fresh orders for the enabled accounts. Doesn't touch the account list itself
 * (that only changes via the explicit "Refresh from DOTB" action) to keep this fast. */
export async function runSync(
  userId?: string
): Promise<{ ordersSynced: number; accountCount: number; autoReleased: number }> {
  const enabledAccounts = await prisma.vintedAccountSelection.findMany({
    where: { enabled: true },
    select: { id: true, dotbAccountId: true },
  });

  const counts = await Promise.all(enabledAccounts.map((account) => syncOrdersForAccount(account)));
  const ordersSynced = counts.reduce((sum, n) => sum + n, 0);

  // The employee queue is driven by DOTB's own "label sent" status rather than a
  // manual admin release — once DOTB reports the label exists, the order is ready
  // to pack and ship, so it auto-advances out of Pending review in one bulk update.
  // This only ever moves PENDING_REVIEW -> RELEASED, never touches an order that's
  // already been released/packed/shipped.
  const { count: autoReleased } = await prisma.order.updateMany({
    where: { source: "DOTB", dotbStatus: "label_sent", localStatus: "PENDING_REVIEW" },
    data: { localStatus: "RELEASED", releasedAt: new Date() },
  });

  await logActivity({
    action: "SYNC_RUN",
    userId,
    metadata: { ordersSynced, accountCount: enabledAccounts.length, autoReleased },
  });

  return { ordersSynced, accountCount: enabledAccounts.length, autoReleased };
}
