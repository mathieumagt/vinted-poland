import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";
import { syncAccounts } from "@/lib/dotb/sync";

export async function GET() {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  try {
    await syncAccounts();
  } catch (err) {
    // Non-fatal: fall back to whatever's already cached locally.
    console.error("Failed to refresh accounts from DOTB", err);
  }

  const accounts = await prisma.vintedAccountSelection.findMany({ orderBy: { login: "asc" } });
  return NextResponse.json({ data: accounts });
}
