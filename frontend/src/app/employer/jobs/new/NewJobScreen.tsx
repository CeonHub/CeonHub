"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobForm } from "@/components/jobs/JobForm";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";
import type { SessionUser } from "@/lib/types";

export function NewJobScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{(user) => <NewJob user={user} />}</AuthGate>
    </Container>
  );
}

function NewJob({ user }: { user: SessionUser }) {
  const meta = useApiQuery<{ categories: string[] }>("/api/jobs/meta");

  return (
    <>
      <PageHeader
        title="Post a job"
        description="Publish it straight away, or save a draft and come back to it."
      />

      {!user.employer?.company ? (
        <Alert tone="info" title="Create your company profile first">
          <p>Jobs are published under a company, so CeonHub needs one before you can post.</p>
          <ButtonLink href="/employer/profile" size="sm" className="mt-3">
            Create company profile
          </ButtonLink>
        </Alert>
      ) : meta.loading ? (
        <LoadingState />
      ) : meta.error ? (
        <ErrorState message={errorMessage(meta.error)} onRetry={meta.reload} />
      ) : (
        <JobForm categories={meta.data?.categories ?? []} />
      )}
    </>
  );
}
