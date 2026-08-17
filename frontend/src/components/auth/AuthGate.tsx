"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { homePathFor, useAuth } from "@/providers/AuthProvider";
import { LoadingState } from "@/components/ui/States";
import type { Role, SessionUser } from "@/lib/types";

interface AuthGateProps {
  roles: Role[];
  children: (user: SessionUser) => ReactNode;
}

/**
 * Client-side guard for dashboard pages: it decides what to *show*, not what is
 * *allowed*. Every protected resource is authorized again by the API, which is the
 * only place that can be trusted.
 */
export function AuthGate({ roles, children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = user !== null && roles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // Admin pages need the staff password page; everyone else signs in with LinkedIn.
      const signInPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
      router.replace(`${signInPath}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allowed) {
      router.replace(homePathFor(user.role));
    }
  }, [loading, user, allowed, router, pathname]);

  if (loading || !user || !allowed) {
    return <LoadingState label="Checking your session…" />;
  }

  return <>{children(user)}</>;
}
