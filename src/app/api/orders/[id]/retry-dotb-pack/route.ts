import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";
import { packOrder, DotbApiError } from "@/lib/dotb/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (existing.source !== "DOTB" || !existing.dotbOrderId) {
    return NextResponse.json({ error: "This order isn't linked to a DOTB order." }, { status: 400 });
  }

  try {
    await packOrder(existing.dotbOrderId);
    const order = await prisma.order.update({
      where: { id },
      data: { dotbPackSyncStatus: "ok", dotbPackSyncError: null },
    });
    await logActivity({ action: "DOTB_PACK_OK", orderId: order.id, userId: auth.userId });
    return NextResponse.json({ data: order });
  } catch (err) {
    const message =
      err instanceof DotbApiError ? `${err.status} ${err.message}` : err instanceof Error ? err.message : "Unknown error";
    const order = await prisma.order.update({
      where: { id },
      data: { dotbPackSyncStatus: "failed", dotbPackSyncError: message },
    });
    await logActivity({ action: "DOTB_PACK_FAILED", orderId: order.id, userId: auth.userId, metadata: { message } });
    return NextResponse.json({ error: message, data: order }, { status: 502 });
  }
}
