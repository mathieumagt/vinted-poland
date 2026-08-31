import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";
import type { LocalStatus } from "@prisma/client";

const VALID_STATUSES: LocalStatus[] = ["PENDING_REVIEW", "RELEASED", "PACKED", "SHIPPED"];

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const accountId = searchParams.get("accountId") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);

  const status = VALID_STATUSES.includes(statusParam as LocalStatus)
    ? (statusParam as LocalStatus)
    : undefined;

  const orders = await prisma.order.findMany({
    where: {
      localStatus: status,
      accountId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { buyerName: { contains: q, mode: "insensitive" } },
              { buyerLogin: { contains: q, mode: "insensitive" } },
              { trackingCode: { contains: q, mode: "insensitive" } },
              { vintedTransactionId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { items: true, account: true },
    orderBy: { orderDate: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: orders });
}

const createOrderSchema = z.object({
  title: z.string().min(1),
  buyerName: z.string().optional(),
  buyerLogin: z.string().optional(),
  buyerCountryCode: z.string().optional(),
  note: z.string().optional(),
  trackingCode: z.string().optional(),
  shippingLabelUrl: z.string().url().optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        size: z.string().optional(),
        thumbnailUrl: z.string().url().optional(),
        sku: z.string().optional(),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order data.", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const order = await prisma.order.create({
    data: {
      source: "MANUAL",
      title: data.title,
      buyerName: data.buyerName,
      buyerLogin: data.buyerLogin,
      buyerCountryCode: data.buyerCountryCode,
      note: data.note,
      trackingCode: data.trackingCode,
      shippingLabelUrl: data.shippingLabelUrl,
      itemCount: data.items.length,
      createdById: auth.userId,
      items: {
        create: data.items.map((item) => ({
          title: item.title,
          size: item.size,
          thumbnailUrl: item.thumbnailUrl,
          sku: item.sku,
        })),
      },
    },
    include: { items: true },
  });

  await logActivity({ action: "ORDER_CREATED_MANUAL", orderId: order.id, userId: auth.userId });

  return NextResponse.json({ data: order }, { status: 201 });
}
