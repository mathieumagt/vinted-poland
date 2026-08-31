import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";
import { getUnpaidParcelCount, EARNINGS_PER_PARCEL_CENTS } from "@/lib/earnings";

export async function GET() {
  const auth = await requireApiUser(["ADMIN", "EMPLOYEE"]);
  if (auth instanceof NextResponse) return auth;

  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    include: { markedBy: { select: { email: true } } },
  });
  return NextResponse.json({ data: payments });
}

const markPaidSchema = z.object({ note: z.string().max(500).optional() });

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const parsed = markPaidSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const parcelCount = await getUnpaidParcelCount();
  if (parcelCount === 0) {
    return NextResponse.json({ error: "Nothing to pay out — balance is already €0.00." }, { status: 409 });
  }

  const amountCents = parcelCount * EARNINGS_PER_PARCEL_CENTS;

  const payment = await prisma.payment.create({
    data: {
      amountCents,
      parcelCount,
      note: parsed.data.note,
      markedById: auth.userId,
    },
  });

  await logActivity({
    action: "EMPLOYEE_PAID",
    userId: auth.userId,
    metadata: { amountCents, parcelCount, paymentId: payment.id },
  });

  return NextResponse.json({ data: payment }, { status: 201 });
}
