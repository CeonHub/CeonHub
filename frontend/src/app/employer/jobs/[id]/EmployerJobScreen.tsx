"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicantList } from "@/components/applications/ApplicantList";
import { JobForm } from "@/components/jobs/JobForm";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Application, Job, JobStatus, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function EmployerJobScreen({ jobId }: { jobId: string }) {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{() => <EmployerJob jobId={jobId} />}</AuthGate>
    </Container>
  );
}

function EmployerJob({ jobId }: { jobId: string }) {
  const jobQuery = useApiQuery<{ job: Job }>(`/api/jobs/${jobId}`);
  const metaQuery = useApiQuery<{ categories: string[] }>("/api/jobs/meta");
  const applicationsQuery = useApiQuery<Paginated<Application>>("/api/applications", {
    jobId,
    pageSize: 50,
  });

  if (jobQuery.loading || metaQuery.loading) return <LoadingState label="Loading job…" />;
  if (jobQuery.error) {
    return <ErrorState message={errorMessage(jobQuery.error)} onRetry={jobQuery.reload} />;
  }

  const job = jobQuery.data?.job;
  if (!job) return <ErrorState message="This job could not be found." />;

  return (
    <>
      <PageHeader
        title={job.title}
        description={`${job.company.name} · ${job.category}`}
        action={<JobStatusBadge status={job.status} />}
      />

      <div className="space-y-6">
        <StatusActions job={job} onChanged={jobQuery.reload} />

        <section aria-label="Applicants">
          <h2 className="pb-3 text-lg font-semibold text-ink-900">
            Applicants ({applicationsQuery.data?.meta.total ?? 0})
          </h2>
          {applicationsQuery.loading ? (
            <LoadingState label="Loading applicants…" />
          ) : applicationsQuery.error ? (
            <ErrorState
              message={errorMessage(applicationsQuery.error)}
              onRetry={applicationsQuery.reload}
            />
          ) : (
            <ApplicantList
              applications={applicationsQuery.data?.items ?? []}
              onChanged={applicationsQuery.reload}
            />
          )}
        </section>

        <section aria-label="Edit job">
          <h2 className="pb-3 text-lg font-semibold text-ink-900">Edit job</h2>
          <JobForm categories={metaQuery.data?.categories ?? []} job={job} />
        </section>
      </div>
    </>
  );
}

const TRANSITIONS: Array<{ status: JobStatus; label: string; hideWhen: JobStatus[] }> = [
  { status: "PUBLISHED", label: "Publish", hideWhen: ["PUBLISHED"] },
  { status: "PAUSED", label: "Pause", hideWhen: ["PAUSED", "DRAFT", "CLOSED"] },
  { status: "CLOSED", label: "Close", hideWhen: ["CLOSED"] },
];

function StatusActions({ job, onChanged }: { job: Job; onChanged: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function setStatus(status: JobStatus) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/jobs/${job.id}`, { method: "PATCH", body: { status } });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      router.push("/employer/jobs");
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Status"
        description={
          job.private
            ? "This is a private opportunity: it is hidden from public search and only invited candidates can apply."
            : "Published jobs are visible in public search and to search engines."
        }
        action={
          <Link
            href={`/jobs/${job.id}`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            View public page
          </Link>
        }
      />
      <CardBody className="space-y-3">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-wrap gap-2">
          {TRANSITIONS.filter((transition) => !transition.hideWhen.includes(job.status)).map(
            (transition) => (
              <Button
                key={transition.status}
                variant={transition.status === "PUBLISHED" ? "primary" : "secondary"}
                size="sm"
                disabled={busy}
                onClick={() => setStatus(transition.status)}
              >
                {transition.label}
              </Button>
            ),
          )}

          {confirmingDelete ? (
            <>
              <Button variant="danger" size="sm" disabled={busy} onClick={remove}>
                Confirm delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
