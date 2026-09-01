"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "./Container";
import { Logo } from "./Logo";

const PUBLIC_LINKS = [
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
  { href: "/how-it-works", label: "How it works" },
];

const ROLE_LINKS: Record<Role, Array<{ href: string; label: string }>> = {
  CANDIDATE: [
    { href: "/candidate/dashboard", label: "Dashboard" },
    { href: "/jobs", label: "Find jobs" },
    { href: "/candidate/applications", label: "Applications" },
    { href: "/candidate/invitations", label: "Invitations" },
  ],
  EMPLOYER: [
    { href: "/employer/dashboard", label: "Dashboard" },
    { href: "/employer/jobs", label: "Jobs" },
    { href: "/employer/applications", label: "Applicants" },
    { href: "/employer/candidates", label: "Find candidates" },
    { href: "/employer/invitations", label: "Invitations" },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/jobs", label: "Jobs" },
  ],
};

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // The menu remembers which page it was opened on, so navigating closes it
  // without needing an effect to reset the state.
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;

  const links = user ? ROLE_LINKS[user.role] : PUBLIC_LINKS;

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(pathname, link.href)}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Link
                href={settingsPathFor(user.role)}
                className="max-w-40 truncate rounded-md px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                {user.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                Sign in
              </Link>
              <ButtonLink href="/register" size="sm">
                Create account
              </ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenu({ open: !menuOpen, path: pathname })}
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-ink-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(pathname, link.href)}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">
              {user ? (
                <>
                  <NavLink href={settingsPathFor(user.role)} active={false}>
                    Settings
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-md px-3 py-2 text-left text-sm font-medium text-ink-600 hover:bg-ink-100"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/login" active={false}>
                    Sign in
                  </NavLink>
                  <ButtonLink href="/register" size="sm" className="w-full">
                    Create account
                  </ButtonLink>
                </>
              )}
            </div>
          </Container>
        </div>
      )}

      <div aria-hidden="true" className="brand-gradient h-0.5 w-full" />
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-50 text-primary-800"
          : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
      )}
    >
      {children}
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0] ?? href;
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function settingsPathFor(role: Role): string {
  if (role === "CANDIDATE") return "/candidate/settings";
  if (role === "EMPLOYER") return "/employer/settings";
  return "/admin";
}
