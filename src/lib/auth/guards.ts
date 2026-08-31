import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function homeForRole(role: SessionPayload["role"]): string {
  return role === "ADMIN" ? "/admin/dashboard" : "/employee/queue";
}

/** Requires any authenticated user; redirects to /login otherwise. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Requires a specific role; redirects non-matching authenticated users to their own home. */
export async function requireRole(
  role: "ADMIN" | "EMPLOYEE"
): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== role) redirect(homeForRole(session.role));
  return session;
}

/** Requires one of several roles; redirects non-matching authenticated users to their own home. */
export async function requireAnyRole(
  roles: Array<"ADMIN" | "EMPLOYEE">
): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role)) redirect(homeForRole(session.role));
  return session;
}
