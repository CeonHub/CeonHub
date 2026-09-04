"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ApiError, apiFetch, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { SessionUser } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

/** Account details and password change, identical for candidates and employers. */
export function AccountSettings({ user }: { user: SessionUser }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Account" />
        <CardBody>
          <dl className="space-y-3 text-sm">
            <Row label="Email" value={user.email} />
            <Row label="Account type" value={user.role === "CANDIDATE" ? "Candidate" : "Employer"} />
            <Row label="Member since" value={formatDate(user.createdAt)} />
            <Row
              label="Sign-in method"
              value={
                user.linkedinConnected
                  ? user.hasPassword
                    ? "Email and LinkedIn"
                    : "LinkedIn"
                  : "Email and password"
              }
            />
          </dl>
        </CardBody>
      </Card>

      {user.hasPassword ? (
        <PasswordCard />
      ) : (
        <Card>
          <CardHeader title="Password" description="This account signs in with LinkedIn." />
          <CardBody className="text-sm text-ink-600">
            There is no password to change. Use the “Sign in with LinkedIn” button whenever you come
            back to CeonHub.
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}

function PasswordCard() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiFetch("/api/users/me/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      // The API ends the session on a password change, so sign in again.
      await refresh();
      router.replace("/login");
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(errorMessage(caught)));
      setSaving(false);
    }
  }

  const fieldError = (field: string) =>
    error instanceof ApiError ? error.fieldError(field) : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader
          title="Change password"
          description="You will be signed out and asked to sign in again."
        />
        <CardBody className="space-y-5">
          {error && <Alert tone="error">{errorMessage(error)}</Alert>}

          <Field
            htmlFor="currentPassword"
            label="Current password"
            error={fieldError("currentPassword")}
            required
          >
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              error={fieldError("currentPassword")}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </Field>

          <Field
            htmlFor="newPassword"
            label="New password"
            hint="At least 8 characters."
            error={fieldError("newPassword")}
            required
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              hint
              value={newPassword}
              error={fieldError("newPassword")}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </Field>

          <Button type="submit" loading={saving}>
            Change password
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}
