"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { apiFetch, errorMessage } from "@/lib/api";
import { APPLICATION_STATUS_LABELS } from "@/lib/format";
import type { Job, JobStatus } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useAuth } from "@/providers/AuthProvider";

/**
 * The action area on a public job page. What it offers depends on who is looking,
 * which is why it runs on the client while the rest of the page is server-rendered.
 */
export function JobApplyPanel({
  jobId,
  jobTitle,
  jobStatus,
}: {
  jobId: string;
  jobTitle: string;
  jobStatus: JobStatus;
}) {
  const { user, loading } = useAuth();

  if (jobStatus !== "PUBLISHED") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm font-medium text-ink-900">Not accepting applications</p>
          <p className="mt-1 text-sm text-ink-500">
            This job is {jobStatus.toLowerCase()}. Browse other open roles instead.
          </p>
          <ButtonLink href="/jobs" variant="secondary" size="sm" className="mt-3">
            Browse jobs
          </ButtonLink>
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-500">Checking your session…</p>
        </CardBody>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm font-medium text-ink-900">Interested in this role?</p>
          <p className="mt-1 text-sm text-ink-500">
            Sign in as a candidate to apply to {jobTitle}, or create a free account.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <ButtonLink href={`/login?next=/jobs/${jobId}`}>Sign in to apply</ButtonLink>
            <ButtonLink href="/register" variant="secondary">
              Create an account
            </ButtonLink>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (user.role !== "CANDIDATE") {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-500">
            You are signed in as {user.role === "EMPLOYER" ? "an employer" : "an administrator"}, so
            you cannot apply to jobs.
          </p>
        </CardBody>
      </Card>
    );
  }

  return <ApplyForm jobId={jobId} />;
}

function ApplyForm({ jobId }: { jobId: string }) {
  // Re-fetched with the candidate's session so the response includes their own
  // application, which the server-rendered (anonymous) page cannot know about.
  const query = useApiQuery<{ job: Job }>(`/api/jobs/${jobId}`);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const existing = query.data?.job.myApplication ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch(`/api/jobs/${jobId}/applications`, {
        method: "POST",
        body: { coverLetter },
      });
      query.reload();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (query.loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-500">Loading…</p>
        </CardBody>
      </Card>
    );
  }

  if (existing) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm font-medium text-ink-900">You applied to this job</p>
          <p className="mt-1 text-sm text-ink-500">
            Status: {APPLICATION_STATUS_LABELS[existing.status]}
          </p>
          <Link
            href="/candidate/applications"
            className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Track your applications
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <p className="text-sm font-medium text-ink-900">Apply for this job</p>
            <p className="mt-1 text-sm text-ink-500">
              Your profile, skills and resume are sent with the application.
            </p>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Field
            htmlFor="coverLetter"
            label="Message to the employer"
            hint="Optional, but it helps."
          >
            <Textarea
              id="coverLetter"
              rows={5}
              hint
              value={coverLetter}
              maxLength={5000}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Why you are a good fit, and when you can start."
            />
          </Field>

          <Button type="submit" loading={submitting} className="w-full">
            Submit application
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
