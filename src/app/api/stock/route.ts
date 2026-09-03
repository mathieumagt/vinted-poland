import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const status = new URL(req.url).searchParams.get("status");

  const items = await prisma.stockItem.findMany({
    where: status === "REMOVED" ? { status: "REMOVED" } : { status: "IN_STOCK" },
    include: { addedBy: { select: { email: true } }, removedBy: { select: { email: true } } },
    orderBy: status === "REMOVED" ? { removedAt: "desc" } : { addedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ data: items });
}

const createStockSchema = z.object({
  photoUrl: z.string().url(),
  title: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const parsed = createStockSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data.", details: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.stockItem.create({
    data: {
      photoUrl: parsed.data.photoUrl,
      title: parsed.data.title,
      note: parsed.data.note,
      addedById: auth.userId,
    },
  });

  await logActivity({ action: "STOCK_ADDED", userId: auth.userId, metadata: { stockItemId: item.id } });

  return NextResponse.json({ data: item }, { status: 201 });
}
