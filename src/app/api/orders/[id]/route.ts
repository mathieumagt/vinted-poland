import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, account: true, activityLogs: { orderBy: { createdAt: "desc" }, include: { user: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ data: order });
}

const updateOrderSchema = z.object({
  title: z.string().min(1).optional(),
  buyerName: z.string().optional(),
  buyerLogin: z.string().optional(),
  buyerCountryCode: z.string().optional(),
  note: z.string().optional(),
  trackingCode: z.string().optional(),
  shippingLabelUrl: z.string().url().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = updateOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order data.", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const order = await prisma.order.update({ where: { id }, data: parsed.data });
  await logActivity({ action: "ORDER_EDITED", orderId: order.id, userId: auth.userId, metadata: parsed.data });

  return NextResponse.json({ data: order });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (existing.source === "DOTB") {
    return NextResponse.json({ error: "DOTB-synced orders cannot be deleted, only manual orders." }, { status: 400 });
  }

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
