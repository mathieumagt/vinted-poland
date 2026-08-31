import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";
import { packOrder, DotbApiError } from "@/lib/dotb/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (existing.localStatus !== "RELEASED") {
    return NextResponse.json({ error: `Order is not in progress (currently ${existing.localStatus.toLowerCase()}).` }, { status: 409 });
  }

  const now = new Date();
  let order = await prisma.order.update({
    where: { id },
    data: {
      localStatus: "SHIPPED",
      packedAt: now,
      packedById: auth.userId,
      shippedAt: now,
      shippedById: auth.userId,
    },
  });

  await logActivity({ action: "ORDER_SHIPPED", orderId: order.id, userId: auth.userId });

  // Best-effort sync back to DOTB — never blocks or reverts the local action.
  if (order.source === "DOTB" && order.dotbOrderId) {
    try {
      await packOrder(order.dotbOrderId);
      order = await prisma.order.update({
        where: { id },
        data: { dotbPackSyncStatus: "ok", dotbPackSyncError: null },
      });
      await logActivity({ action: "DOTB_PACK_OK", orderId: order.id, userId: auth.userId });
    } catch (err) {
      const message =
        err instanceof DotbApiError ? `${err.status} ${err.message}` : err instanceof Error ? err.message : "Unknown error";
      order = await prisma.order.update({
        where: { id },
        data: { dotbPackSyncStatus: "failed", dotbPackSyncError: message },
      });
      await logActivity({ action: "DOTB_PACK_FAILED", orderId: order.id, userId: auth.userId, metadata: { message } });
    }
  }

  return NextResponse.json({ data: order });
}
