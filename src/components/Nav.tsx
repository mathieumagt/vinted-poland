"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavLink = { href: string; label: string };

export function Nav({
  links,
  email,
  role,
}: {
  links: NavLink[];
  email: string;
  role: "ADMIN" | "EMPLOYEE";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-xs font-bold text-white">V</span>
            Vinted Poland
          </span>
          <nav className="flex gap-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-accent-soft text-accent" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span className="hidden sm:inline">
            {email} <span className="text-zinc-400">· {role}</span>
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {loggingOut ? "…" : "Log out"}
          </button>
        </div>
      </div>
    </header>
  );
}
