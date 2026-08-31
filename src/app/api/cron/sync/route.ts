import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/dotb/sync";
import { DotbApiError } from "@/lib/dotb/client";

/** Hit on a schedule (Vercel Cron in production) to keep orders flowing to the
 * employee queue without anyone having to click "Sync now". */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runSync();
    return NextResponse.json({ data: result });
  } catch (err) {
    const message =
      err instanceof DotbApiError ? `${err.status} ${err.message}` : err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
