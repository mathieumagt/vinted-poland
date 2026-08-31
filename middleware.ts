import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*"],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const path = req.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin");
  const isEmployeePath = path.startsWith("/employee");

  if (isAdminPath && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/employee/queue", req.url));
  }
  if (isEmployeePath && session.role !== "EMPLOYEE" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
}
