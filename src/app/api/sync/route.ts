import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { runSync } from "@/lib/dotb/sync";
import { DotbApiError } from "@/lib/dotb/client";

export async function POST() {
  const auth = await requireApiUser(["ADMIN"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await runSync(auth.userId);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message =
      err instanceof DotbApiError ? `${err.status} ${err.message}` : err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
