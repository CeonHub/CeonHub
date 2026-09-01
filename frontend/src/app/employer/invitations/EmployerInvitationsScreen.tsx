"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvitationStatusBadge } from "@/components/invitations/InvitationStatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import { INVITATION_STATUS_LABELS, formatRelative } from "@/lib/format";
import type { Invitation, InvitationStatus, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function EmployerInvitationsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{() => <EmployerInvitations />}</AuthGate>
    </Container>
  );
}

function EmployerInvitations() {
  const [status, setStatus] = useState<InvitationStatus | "">("");
  const [page, setPage] = useState(1);

  const query = useApiQuery<Paginated<Invitation>>("/api/invitations", {
    status: status || undefined,
    page,
    pageSize: 20,
  });

  return (
    <>
      <PageHeader
        title="Invitations sent"
        description="Private opportunities you offered directly to candidates."
        action={<ButtonLink href="/employer/candidates">Find candidates</ButtonLink>}
      />

      <div className="mb-4">
        <Select
          id="statusFilter"
          aria-label="Filter by status"
          className="w-52"
          placeholder="All statuses"
          value={status}
          options={Object.entries(INVITATION_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={(event) => {
            setStatus(event.target.value as InvitationStatus | "");
            setPage(1);
          }}
        />
      </div>

      {query.loading ? (
        <LoadingState label="Loading invitations…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <Card>
            <ul className="divide-y divide-ink-100">
              {query.data.items.map((invitation) => (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{invitation.candidate?.name}</p>
                    <p className="text-sm text-ink-500">
                      <Link
                        href={`/employer/jobs/${invitation.job.id}`}
                        className="text-primary-700 hover:underline"
                      >
                        {invitation.job.title}
                      </Link>
                      {invitation.job.private && " (private)"} · sent{" "}
                      {formatRelative(invitation.createdAt)}
                    </p>
                    {invitation.message && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink-600">{invitation.message}</p>
                    )}
                  </div>
                  <InvitationStatusBadge status={invitation.status} />
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
          title="No invitations sent yet"
          description="Search the candidate directory and invite someone to a private opportunity."
          action={<ButtonLink href="/employer/candidates">Find candidates</ButtonLink>}
        />
      )}
    </>
  );
}
