import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api";

export async function GET() {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  const accounts = await prisma.vintedAccountSelection.findMany({ orderBy: { login: "asc" } });
  return NextResponse.json({ data: accounts });
}
