"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicantList } from "@/components/applications/ApplicantList";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import { APPLICATION_STATUS_LABELS } from "@/lib/format";
import type { Application, ApplicationStatus, JobSummary, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function EmployerApplicationsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{() => <EmployerApplications />}</AuthGate>
    </Container>
  );
}

function EmployerApplications() {
  const searchParams = useSearchParams();
  const [jobId, setJobId] = useState(searchParams.get("jobId") ?? "");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [page, setPage] = useState(1);

  const jobs = useApiQuery<Paginated<JobSummary>>("/api/jobs/mine", { pageSize: 50 });
  const applications = useApiQuery<Paginated<Application>>("/api/applications", {
    jobId: jobId || undefined,
    status: status || undefined,
    page,
    pageSize: 20,
  });

  return (
    <>
      <PageHeader
        title="Applicants"
        description="Everyone who applied to your jobs, newest first."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          id="jobFilter"
          aria-label="Filter by job"
          className="w-64"
          placeholder="All jobs"
          value={jobId}
          options={(jobs.data?.items ?? []).map((job) => ({ value: job.id, label: job.title }))}
          onChange={(event) => {
            setJobId(event.target.value);
            setPage(1);
          }}
        />
        <Select
          id="statusFilter"
          aria-label="Filter by status"
          className="w-52"
          placeholder="All statuses"
          value={status}
          options={Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={(event) => {
            setStatus(event.target.value as ApplicationStatus | "");
            setPage(1);
          }}
        />
      </div>

      {applications.loading ? (
        <LoadingState label="Loading applicants…" />
      ) : applications.error ? (
        <ErrorState message={errorMessage(applications.error)} onRetry={applications.reload} />
      ) : (
        <>
          <ApplicantList
            applications={applications.data?.items ?? []}
            onChanged={applications.reload}
            showJob
            emptyTitle="No applications match this filter"
            emptyDescription="Try a different job or status, or invite candidates directly."
          />
          {applications.data && (
            <Pagination
              className="mt-6"
              page={applications.data.meta.page}
              totalPages={applications.data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </>
  );
}
