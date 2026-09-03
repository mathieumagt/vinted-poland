import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Stock item not found." }, { status: 404 });
  if (existing.status === "REMOVED") {
    return NextResponse.json({ error: "Already removed from stock." }, { status: 409 });
  }

  const item = await prisma.stockItem.update({
    where: { id },
    data: { status: "REMOVED", removedAt: new Date(), removedById: auth.userId },
  });

  await logActivity({ action: "STOCK_REMOVED", userId: auth.userId, metadata: { stockItemId: item.id } });

  return NextResponse.json({ data: item });
}
