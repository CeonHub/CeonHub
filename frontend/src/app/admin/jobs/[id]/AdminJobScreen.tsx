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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import type { Application, Job, JobStatus, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function AdminJobScreen({ jobId }: { jobId: string }) {
  return (
    <Container className="py-10">
      <AuthGate roles={["ADMIN"]}>{() => <AdminJob jobId={jobId} />}</AuthGate>
    </Container>
  );
}

function AdminJob({ jobId }: { jobId: string }) {
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
        action={
          <span className="flex items-center gap-2">
            {job.private && <Badge tone="primary">Private</Badge>}
            <JobStatusBadge status={job.status} />
          </span>
        }
      />

      <div className="space-y-6">
        <StatusActions job={job} onChanged={jobQuery.reload} />

        <section aria-label="Applicants">
          <h2 className="pb-3 text-lg font-extrabold tracking-tight text-ink-950">
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
          <h2 className="pb-3 text-lg font-extrabold tracking-tight text-ink-950">Edit job</h2>
          <JobForm
            categories={metaQuery.data?.categories ?? []}
            job={job}
            companies={[]}
            manageBasePath="/admin/jobs"
          />
        </section>
      </div>
    </>
  );
}

/**
 * DRAFT, PUBLISHED, PAUSED and CLOSED go through PATCH /api/jobs/:id, the same
 * endpoint the employer console uses. HIDDEN is moderation and lives on the admin
 * route instead, because hiding a job also locks its employer out of editing it.
 */
const TRANSITIONS: Array<{ status: JobStatus; label: string; hideWhen: JobStatus[] }> = [
  { status: "PUBLISHED", label: "Publish", hideWhen: ["PUBLISHED", "HIDDEN"] },
  { status: "PAUSED", label: "Pause", hideWhen: ["PAUSED", "DRAFT", "CLOSED", "HIDDEN"] },
  { status: "CLOSED", label: "Close", hideWhen: ["CLOSED", "HIDDEN"] },
];

function StatusActions({ job, onChanged }: { job: Job; onChanged: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const setStatus = (status: JobStatus) =>
    run(() => apiFetch(`/api/jobs/${job.id}`, { method: "PATCH", body: { status } }));

  const moderate = (status: "HIDDEN" | "PUBLISHED") =>
    run(() =>
      apiFetch(`/api/admin/jobs/${job.id}/status`, { method: "PATCH", body: { status } }),
    );

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      router.push("/admin/jobs");
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
          job.status === "HIDDEN"
            ? "Hidden by staff: out of public search, and its employer cannot edit it until it is restored."
            : job.private
              ? "This is a private opportunity: hidden from public search, and only invited candidates can apply."
              : "Published jobs are visible in public search and to search engines."
        }
        action={
          <Link
            href={`/jobs/${job.id}`}
            className="text-sm font-medium text-primary-700 hover:underline"
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

          {job.status === "HIDDEN" ? (
            <Button variant="primary" size="sm" disabled={busy} onClick={() => moderate("PUBLISHED")}>
              Restore
            </Button>
          ) : (
            <Button variant="danger" size="sm" disabled={busy} onClick={() => moderate("HIDDEN")}>
              Hide
            </Button>
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

        <p className="text-sm text-ink-500">
          Closing stops new applications and keeps the job and its history. Deleting is only
          possible while nothing has been applied to it.
        </p>
      </CardBody>
    </Card>
  );
}
