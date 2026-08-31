import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session";

/** Auth check for Route Handlers — returns the session, or a 401/403 NextResponse to return immediately. */
export async function requireApiUser(
  roles?: Array<"ADMIN" | "EMPLOYEE">
): Promise<SessionPayload | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (roles && !roles.includes(session.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  return session;
}
