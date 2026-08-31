import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";

const noteSchema = z.object({ note: z.string().max(2000) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = noteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid note." }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const order = await prisma.order.update({ where: { id }, data: { note: parsed.data.note } });
  return NextResponse.json({ data: order });
}
