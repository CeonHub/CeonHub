"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CONTROL_BORDER, CONTROL_CLASSES } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { JOB_STATUS_LABELS, formatDate } from "@/lib/format";
import type { JobStatus, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

interface AdminJobRow {
  id: string;
  title: string;
  status: JobStatus;
  private: boolean;
  createdAt: string;
  company: { id: string; name: string; slug: string };
  applicationCount: number;
}

export function AdminJobsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["ADMIN"]}>{() => <AdminJobs />}</AuthGate>
    </Container>
  );
}

function AdminJobs() {
  const [filters, setFilters] = useState<{ q: string; status: JobStatus | "" }>({
    q: "",
    status: "",
  });
  const [page, setPage] = useState(1);

  const query = useApiQuery<Paginated<AdminJobRow>>("/api/admin/jobs", {
    q: filters.q || undefined,
    status: filters.status || undefined,
    page,
    pageSize: 25,
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFilters({
      q: String(data.get("q") ?? ""),
      status: (data.get("status") as JobStatus | null) ?? "",
    });
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Hide a job to remove it from public search and lock it for its employer."
      />

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-wrap gap-3 rounded-card border border-ink-200 bg-white p-5"
        role="search"
      >
        <input
          name="q"
          type="text"
          defaultValue={filters.q}
          placeholder="Job title or company"
          aria-label="Search jobs"
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "w-72")}
        />
        <Select
          id="status"
          name="status"
          aria-label="Status"
          className="w-48"
          placeholder="All statuses"
          defaultValue={filters.status}
          options={Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Button type="submit">Search</Button>
      </form>

      {query.loading ? (
        <LoadingState label="Loading jobs…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <Card>
            <ul className="divide-y divide-ink-100">
              {query.data.items.map((job) => (
                <JobRow key={job.id} job={job} onChanged={query.reload} />
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
        <EmptyState title="No jobs match this search" />
      )}
    </>
  );
}

function JobRow({ job, onChanged }: { job: AdminJobRow; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "HIDDEN" | "PUBLISHED" | "CLOSED") {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/jobs/${job.id}/status`, { method: "PATCH", body: { status } });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="font-medium text-ink-900">
          <Link href={`/jobs/${job.id}`} className="hover:text-brand-700">
            {job.title}
          </Link>
        </p>
        <p className="text-sm text-ink-500">
          {job.company.name} · {job.applicationCount} application
          {job.applicationCount === 1 ? "" : "s"} · posted {formatDate(job.createdAt)}
        </p>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        {job.private && <Badge tone="brand">Private</Badge>}
        <JobStatusBadge status={job.status} />

        {job.status === "HIDDEN" ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStatus("PUBLISHED")}>
            Restore
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStatus("CLOSED")}>
              Close
            </Button>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => setStatus("HIDDEN")}>
              Hide
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
