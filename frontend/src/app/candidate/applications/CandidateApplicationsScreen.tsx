"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { Application, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function CandidateApplicationsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["CANDIDATE"]}>{() => <CandidateApplications />}</AuthGate>
    </Container>
  );
}

function CandidateApplications() {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Paginated<Application>>("/api/applications", { page, pageSize: 20 });

  return (
    <>
      <PageHeader
        title="Your applications"
        description="Every job you have applied to, newest first."
        action={<ButtonLink href="/jobs">Find more jobs</ButtonLink>}
      />

      {query.loading ? (
        <LoadingState label="Loading your applications…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <Card>
            <ul className="divide-y divide-ink-100">
              {query.data.items.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onChanged={query.reload}
                />
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
          title="No applications yet"
          description="When you apply to a job it appears here, with its current status."
          action={<ButtonLink href="/jobs">Browse jobs</ButtonLink>}
        />
      )}
    </>
  );
}

const ACTIVE_STATUSES = ["SUBMITTED", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFER"];

function ApplicationRow({
  application,
  onChanged,
}: {
  application: Application;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        body: { status: "WITHDRAWN" },
      });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <Link
          href={`/jobs/${application.job.id}`}
          className="font-medium text-ink-900 hover:text-primary-700"
        >
          {application.job.title}
        </Link>
        <p className="text-sm text-ink-500">
          {application.job.company.name} · applied {formatRelative(application.createdAt)}
        </p>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      </div>

      <div className="flex items-center gap-3">
        <ApplicationStatusBadge status={application.status} />
        {ACTIVE_STATUSES.includes(application.status) && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={withdraw}>
            Withdraw
          </Button>
        )}
      </div>
    </li>
  );
}
