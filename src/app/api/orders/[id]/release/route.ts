import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (existing.localStatus !== "PENDING_REVIEW") {
    return NextResponse.json({ error: `Order is already ${existing.localStatus.toLowerCase()}.` }, { status: 409 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { localStatus: "RELEASED", releasedAt: new Date(), releasedById: auth.userId },
  });

  await logActivity({ action: "ORDER_RELEASED", orderId: order.id, userId: auth.userId });

  return NextResponse.json({ data: order });
}
