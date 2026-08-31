import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { syncAccounts } from "@/lib/dotb/sync";
import { DotbApiError } from "@/lib/dotb/client";

export async function POST() {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  try {
    await syncAccounts();
  } catch (err) {
    const message =
      err instanceof DotbApiError ? `${err.status} ${err.message}` : err instanceof Error ? err.message : "Could not reach DOTB.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const accounts = await prisma.vintedAccountSelection.findMany({ orderBy: { login: "asc" } });
  return NextResponse.json({ data: accounts });
}
