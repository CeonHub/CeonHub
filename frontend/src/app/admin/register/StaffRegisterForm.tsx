"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ApiError, errorMessage } from "@/lib/api";
import { ADMIN_EMAIL_DOMAIN } from "@/lib/env";
import { homePathFor, useAuth } from "@/providers/AuthProvider";

export function StaffRegisterForm() {
  const { registerAdmin } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mismatch, setMismatch] = useState<string | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Confirmation is checked here and never sent: the API has no use for it, and a
    // typo should be caught before it becomes a password nobody knows.
    if (password !== confirm) {
      setMismatch("Passwords do not match");
      return;
    }

    setMismatch(undefined);
    setSubmitting(true);
    setError(null);

    try {
      const user = await registerAdmin(email, password);
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

      <Field
        htmlFor="email"
        label="Work email"
        hint={`Must be an @${ADMIN_EMAIL_DOMAIN} address.`}
        error={fieldError("email")}
        required
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={`you@${ADMIN_EMAIL_DOMAIN}`}
          required
          value={email}
          error={fieldError("email")}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field
        htmlFor="password"
        label="Password"
        hint="At least 8 characters."
        error={fieldError("password")}
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          error={fieldError("password")}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Field htmlFor="confirm" label="Confirm password" error={mismatch} required>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          error={mismatch}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </Field>

      <Button type="submit" loading={submitting} className="w-full">
        Create staff account
      </Button>

      <p className="text-center text-sm text-ink-600">
        Already have an account?{" "}
        <Link href="/admin/login" className="font-medium text-primary-700 hover:underline">
          Staff sign-in
        </Link>
      </p>
    </form>
  );
}
