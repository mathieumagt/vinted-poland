import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activityLog";
import { listAccounts, listOrders } from "./client";
import type { DotbOrder } from "./types";
import type { Prisma } from "@prisma/client";

const PAGE_DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toDecimalString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
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
    carrierName: dotbOrder.carrier_name,
    trackingCode: dotbOrder.tracking_code,
    trackingUrl: dotbOrder.tracking_url,
    itemCount: dotbOrder.item_count ?? undefined,
    vintedTransactionId: dotbOrder.vinted_transaction_id ? String(dotbOrder.vinted_transaction_id) : null,
    vintedConversationId: dotbOrder.vinted_conversation_id ? String(dotbOrder.vinted_conversation_id) : null,
    subtotal: toDecimalString(dotbOrder.subtotal),
    shipping: toDecimalString(dotbOrder.shipping),
    currency: dotbOrder.currency,
    payout: toDecimalString(dotbOrder.payout),
    totalCost: toDecimalString(dotbOrder.total_cost),
    buyerVintedId: dotbOrder.buyer?.vinted_id ? String(dotbOrder.buyer.vinted_id) : null,
    buyerLogin: dotbOrder.buyer?.login ?? null,
    buyerName: dotbOrder.buyer?.name ?? null,
    buyerEmail: dotbOrder.buyer?.email ?? null,
    buyerCountryCode: dotbOrder.buyer?.country_code ?? null,
  };

  const order = await prisma.order.upsert({
    where: { dotbOrderId: dotbOrder.id },
    update: baseData,
    create: {
      ...baseData,
      dotbOrderId: dotbOrder.id,
    },
  });

  for (const item of dotbOrder.items ?? []) {
    await prisma.orderItem.upsert({
      where: { orderId_dotbItemId: { orderId: order.id, dotbItemId: item.id } },
      update: {
        title: item.title,
        thumbnailUrl: item.thumbnail_url,
        sellingPrice: toDecimalString(item.selling_price),
        purchasePrice: toDecimalString(item.purchase_price),
        sku: item.sku,
        location: item.location,
        catalogId: item.catalog_id ? String(item.catalog_id) : null,
        vintedId: item.vinted_id ? String(item.vinted_id) : null,
        vintedItemId: item.vinted_item_id ? String(item.vinted_item_id) : null,
      },
      create: {
        orderId: order.id,
        dotbItemId: item.id,
        title: item.title,
        thumbnailUrl: item.thumbnail_url,
        sellingPrice: toDecimalString(item.selling_price),
        purchasePrice: toDecimalString(item.purchase_price),
        sku: item.sku,
        location: item.location,
        catalogId: item.catalog_id ? String(item.catalog_id) : null,
        vintedId: item.vinted_id ? String(item.vinted_id) : null,
        vintedItemId: item.vinted_item_id ? String(item.vinted_item_id) : null,
      },
    });
  }

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
      include: ["items", "buyer"],
      limit: 100,
      cursor,
    });

    for (const dotbOrder of page.data) {
      await upsertOrder(dotbOrder, account.id);
      count += 1;
    }

    cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined;
    if (cursor) await sleep(PAGE_DELAY_MS);
  } while (cursor);

  await prisma.vintedAccountSelection.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  return count;
}

export async function runSync(userId?: string): Promise<{ accountsSynced: number; ordersSynced: number }> {
  const { synced: accountsSynced } = await syncAccounts();

  const enabledAccounts = await prisma.vintedAccountSelection.findMany({
    where: { enabled: true },
    select: { id: true, dotbAccountId: true },
  });

  let ordersSynced = 0;
  for (const account of enabledAccounts) {
    ordersSynced += await syncOrdersForAccount(account);
    await sleep(PAGE_DELAY_MS);
  }

  await logActivity({
    action: "SYNC_RUN",
    userId,
    metadata: { accountsSynced, ordersSynced, enabledAccountCount: enabledAccounts.length },
  });

  return { accountsSynced, ordersSynced };
}
