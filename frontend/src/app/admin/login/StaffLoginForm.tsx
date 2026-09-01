"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ApiError, errorMessage } from "@/lib/api";
import { homePathFor, useAuth } from "@/providers/AuthProvider";

export function StaffLoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = await login(email, password);
      router.replace(homePathFor(user.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(errorMessage(caught)));
      setSubmitting(false);
    }
  }

  const fieldError = (field: string) =>
    error instanceof ApiError ? error.fieldError(field) : undefined;

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      {error && !(error instanceof ApiError && error.fieldErrors.length > 0) && (
        <Alert tone="error">{errorMessage(error)}</Alert>
      )}

      <Field htmlFor="email" label="Email" error={fieldError("email")} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={fieldError("email")}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field htmlFor="password" label="Password" error={fieldError("password")} required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          error={fieldError("password")}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" loading={submitting} className="w-full">
        Sign in
      </Button>

      <p className="text-center text-sm text-ink-600">
        Not staff?{" "}
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Sign in with LinkedIn
        </Link>
      </p>
    </form>
  );
}
