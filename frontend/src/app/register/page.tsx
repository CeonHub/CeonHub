import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";
import { LoadingState } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Join CeonHub with LinkedIn as a candidate looking for work or as an employer hiring talent.",
  robots: { index: false },
};

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink-900">Create your account</h1>
      <p className="mt-1 text-sm text-ink-500">
        One click with LinkedIn. You can complete your profile afterwards.
      </p>

      <Suspense fallback={<LoadingState className="mt-8" />}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
