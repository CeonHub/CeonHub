"use client";

import { buildQuery } from "@/lib/api";
import { API_URL } from "@/lib/env";
import type { Role } from "@/lib/types";

/**
 * Starts the LinkedIn sign-in flow.
 *
 * This is a plain link, not a fetch: the browser has to navigate to LinkedIn and
 * come back to the API's callback, which then sets the session cookie and redirects
 * to the app. `role` and `next` are passed to the API, which puts them inside the
 * OAuth `state`, because LinkedIn ignores query parameters on the registered
 * callback URL.
 */
export function LinkedInButton({
  role,
  next,
  label = "Continue with LinkedIn",
}: {
  role?: Exclude<Role, "ADMIN">;
  next?: string;
  label?: string;
}) {
  const href = `${API_URL}/api/auth/linkedin${buildQuery({ role, next })}`;

  return (
    <a
      href={href}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-control border border-ink-200 bg-white px-4 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="#0A66C2">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
      {label}
    </a>
  );
}

/** Divider between social sign-in and the email form. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-ink-200" />
      <span className="text-xs font-medium tracking-wide text-ink-400 uppercase">{label}</span>
      <span className="h-px flex-1 bg-ink-200" />
    </div>
  );
}
