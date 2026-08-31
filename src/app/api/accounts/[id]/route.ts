import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { logActivity } from "@/lib/activityLog";

const toggleSchema = z.object({ enabled: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const parsed = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });

  const account = await prisma.vintedAccountSelection.update({
    where: { id },
    data: { enabled: parsed.data.enabled },
  });

  await logActivity({
    action: "ACCOUNT_TOGGLED",
    userId: auth.userId,
    metadata: { accountId: account.id, login: account.login, enabled: account.enabled },
  });

  return NextResponse.json({ data: account });
}
