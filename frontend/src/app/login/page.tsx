import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LoadingState } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your CeonHub account to apply for work or hire candidates.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">Sign in</h1>
      <p className="mt-1 text-sm text-ink-500">
        Welcome back. Sign in to continue where you left off.
      </p>

      <Suspense fallback={<LoadingState className="mt-8" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
