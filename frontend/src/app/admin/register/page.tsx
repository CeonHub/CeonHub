import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffRegisterForm } from "./StaffRegisterForm";
import { LoadingState } from "@/components/ui/States";
import { ADMIN_EMAIL_DOMAIN } from "@/lib/env";

export const metadata: Metadata = {
  title: "Staff sign-up",
  description: "Create a CeonHub administrator account.",
  robots: { index: false, follow: false },
};

/**
 * Staff create their own account rather than waiting for one to be seeded, with the
 * email domain as the gate. Like the sign-in page it is deliberately unlinked from
 * the navigation — knowing the URL is not meant to be the security boundary, but
 * there is no reason to advertise it either.
 */
export default function StaffRegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink-900">Staff sign-up</h1>
      <p className="mt-1 text-sm text-ink-500">
        For CeonHub administrators. Open to {ADMIN_EMAIL_DOMAIN} addresses only — candidates and
        employers join with LinkedIn.
      </p>

      <Suspense fallback={<LoadingState className="mt-8" />}>
        <StaffRegisterForm />
      </Suspense>
    </main>
  );
}
