import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffLoginForm } from "./StaffLoginForm";
import { LoadingState } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Staff sign-in",
  description: "Password sign-in for CeonHub administrators.",
  robots: { index: false, follow: false },
};

/**
 * Administrators cannot be created through LinkedIn, so they keep a password. This
 * page is intentionally not linked from the navigation or the public sign-in page.
 */
export default function StaffLoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink-900">Staff sign-in</h1>
      <p className="mt-1 text-sm text-ink-500">
        For CeonHub administrators. Candidates and employers sign in with LinkedIn.
      </p>

      <Suspense fallback={<LoadingState className="mt-8" />}>
        <StaffLoginForm />
      </Suspense>
    </main>
  );
}
