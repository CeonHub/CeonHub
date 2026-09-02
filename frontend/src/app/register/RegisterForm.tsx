"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthDivider, LinkedInButton } from "@/components/auth/LinkedInButton";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/cn";
import type { AuthProviders } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

type SignupRole = "CANDIDATE" | "EMPLOYER";

const ROLE_CHOICES: Array<{ value: SignupRole; title: string; description: string }> = [
  {
    value: "CANDIDATE",
    title: "I'm looking for work",
    description: "Apply to jobs, get private invitations",
  },
  {
    value: "EMPLOYER",
    title: "I'm hiring",
    description: "Post jobs, search and invite candidates",
  },
];

/**
 * Joining CeonHub means signing in with LinkedIn. The role is chosen here and sent
 * with the request, so the account is created as the right type when LinkedIn sends
 * the member back.
 */
export function RegisterForm() {
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  // Set by the LinkedIn callback when a new member arrived without choosing a role.
  const needsRole = searchParams.get("linkedin") === "choose-role";
  const providerError = searchParams.get("error");
  const providers = useApiQuery<{ providers: AuthProviders }>("/api/auth/providers");

  const [role, setRole] = useState<SignupRole>(roleParam === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE");

  return (
    <div className="mt-8 space-y-5">
      {providerError && <Alert tone="error">{providerError}</Alert>}
      {needsRole && (
        <Alert tone="info" title="Almost there">
          Choose whether you are looking for work or hiring, then continue with LinkedIn again.
        </Alert>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-ink-800">I want to…</legend>
        <div className="mt-2 grid gap-2">
          {ROLE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-control border p-3 transition-colors",
                role === choice.value
                  ? "border-primary-600 bg-primary-50"
                  : "border-ink-200 bg-white hover:bg-ink-50",
              )}
            >
              <input
                type="radio"
                name="role"
                value={choice.value}
                checked={role === choice.value}
                onChange={() => setRole(choice.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink-900">{choice.title}</span>
                <span className="block text-sm text-ink-500">{choice.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {providers.loading ? (
        <p className="text-sm text-ink-500">Loading sign-up options…</p>
      ) : providers.data?.providers.linkedin ? (
        <>
          <LinkedInButton role={role} label="Continue with LinkedIn" />
          <p className="text-center text-sm text-ink-500">
            We use your LinkedIn name and email address to create your account. You choose what
            else to add to your profile afterwards.
          </p>
        </>
      ) : (
        <Alert tone="error" title="Sign-up is unavailable">
          CeonHub accounts are created with LinkedIn, and LinkedIn sign-in is not configured on
          this server yet. Please try again later.
        </Alert>
      )}

      <AuthDivider label="already a member?" />

      <p className="text-center text-sm text-ink-600">
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
