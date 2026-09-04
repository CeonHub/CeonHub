"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { JobStatus, JobSummary, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

const STATUS_TABS: Array<{ value: JobStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PAUSED", label: "Paused" },
  { value: "CLOSED", label: "Closed" },
];

export function EmployerJobsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{() => <EmployerJobs />}</AuthGate>
    </Container>
  );
}

function EmployerJobs() {
  const [status, setStatus] = useState<JobStatus | "">("");
  const [page, setPage] = useState(1);

  const query = useApiQuery<Paginated<JobSummary>>("/api/jobs/mine", {
    status: status || undefined,
    page,
    pageSize: 20,
  });

  return (
    <>
      <PageHeader
        title="Your jobs"
        description="Publish, pause or close roles and see how many people applied."
        action={<ButtonLink href="/employer/jobs/new">Post a job</ButtonLink>}
      />

      <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={
              status === tab.value
                ? "rounded-control border border-brand-edge bg-brand px-3 py-1.5 text-sm font-medium text-brand-fg"
                : "rounded-control px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-100"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.loading ? (
        <LoadingState label="Loading your jobs…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <Card>
            <ul className="divide-y divide-ink-100">
              {query.data.items.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/employer/jobs/${job.id}`}
                      className="font-medium text-ink-900 hover:text-primary-700"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {job.category} · updated {formatRelative(job.createdAt)}
                      {job.private && " · private"}
                    </p>
                  </div>

                  <JobStatusBadge status={job.status} />

                  <Link
                    href={`/employer/applications?jobId=${job.id}`}
                    className="text-sm font-medium text-primary-700 hover:underline"
                  >
                    {job.applicationCount ?? 0} applicant
                    {(job.applicationCount ?? 0) === 1 ? "" : "s"}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Pagination
            className="mt-6"
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No jobs yet"
          description="Post your first role. It takes a couple of minutes."
          action={<ButtonLink href="/employer/jobs/new">Post a job</ButtonLink>}
        />
      )}
    </>
  );
}
