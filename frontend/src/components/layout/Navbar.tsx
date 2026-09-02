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
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      {/* Three tracks rather than a flex row: the outer two share the leftover
          space evenly, which is what keeps the nav optically centred no matter
          how wide the account controls on the right happen to get. */}
      <Container className="grid h-20 grid-cols-[auto_1fr] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <Logo />

        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} active={isActive(pathname, link.href)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center justify-end gap-2 md:flex">
          {loading ? null : user ? (
            <>
              <Link
                href={settingsPathFor(user.role)}
                className="max-w-40 truncate rounded-control px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                {user.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-control px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-control px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950"
              >
                Sign in
              </Link>
              <ButtonLink href="/register">Create account</ButtonLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-control text-ink-800 ring-1 ring-ink-200 ring-inset transition-colors hover:bg-ink-50 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenu({ open: !menuOpen, path: pathname })}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-ink-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(pathname, link.href)}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-ink-200 pt-4">
              {user ? (
                <>
                  <NavLink href={settingsPathFor(user.role)} active={false}>
                    Settings
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-control px-3 py-2 text-left text-sm font-medium text-ink-600 hover:bg-ink-100"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/login" active={false}>
                    Sign in
                  </NavLink>
                  <ButtonLink href="/register" className="w-full">
                    Create account
                  </ButtonLink>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
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
        "rounded-control px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-ink-100 text-ink-950" : "text-ink-700 hover:bg-ink-50 hover:text-ink-950",
      )}
    >
      {children}
    </Link>
  );
}

/** Two bars that cross on open — cheaper than shipping an icon set for one glyph. */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative block h-4 w-5">
      <span
        className={cn(
          "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-transform duration-200",
          open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5",
        )}
      />
      <span
        className={cn(
          "absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-transform duration-200",
          open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0.5",
        )}
      />
    </span>
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
