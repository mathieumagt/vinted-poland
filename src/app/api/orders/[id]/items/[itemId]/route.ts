import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";

const updateItemSchema = z.object({ size: z.string().max(50) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id, itemId } = await params;
  const parsed = updateItemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid size." }, { status: 400 });

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item || item.orderId !== id) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: { size: parsed.data.size || null },
  });

  return NextResponse.json({ data: updated });
}
