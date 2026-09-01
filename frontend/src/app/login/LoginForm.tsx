"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthDivider, LinkedInButton } from "@/components/auth/LinkedInButton";
import { Alert } from "@/components/ui/Alert";
import type { AuthProviders } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

/**
 * Candidates and employers sign in with LinkedIn. Staff accounts use a password on
 * /admin/login, which is deliberately not linked from anywhere public.
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  // Set by the LinkedIn callback when it has to send the browser back here.
  const providerError = searchParams.get("error");
  const providers = useApiQuery<{ providers: AuthProviders }>("/api/auth/providers");

  return (
    <div className="mt-8 space-y-5">
      {providerError && <Alert tone="error">{providerError}</Alert>}

      {providers.loading ? (
        <p className="text-sm text-ink-500">Loading sign-in options…</p>
      ) : providers.data?.providers.linkedin ? (
        <LinkedInButton next={next ?? undefined} label="Sign in with LinkedIn" />
      ) : (
        <Alert tone="error" title="Sign-in is unavailable">
          CeonHub uses LinkedIn to sign in, and it is not configured on this server yet. Please
          try again later.
        </Alert>
      )}

      <AuthDivider label="new here?" />

      <p className="text-center text-sm text-ink-600">
        <Link href="/register" className="font-medium text-primary-700 hover:underline">
          Create an account
        </Link>{" "}
        — it also takes one click.
      </p>
    </div>
  );
}
