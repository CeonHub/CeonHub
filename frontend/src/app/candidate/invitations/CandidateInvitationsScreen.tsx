"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvitationStatusBadge } from "@/components/invitations/InvitationStatusBadge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { Invitation, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function CandidateInvitationsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["CANDIDATE"]}>{() => <CandidateInvitations />}</AuthGate>
    </Container>
  );
}

function CandidateInvitations() {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Paginated<Invitation>>("/api/invitations", { page, pageSize: 20 });

  return (
    <>
      <PageHeader
        title="Private invitations"
        description="Opportunities offered to you directly. Accepting sends your application to the employer."
      />

      {query.loading ? (
        <LoadingState label="Loading invitations…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <div className="space-y-3">
            {query.data.items.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onChanged={query.reload}
              />
            ))}
          </div>
          <Pagination
            className="mt-6"
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          title="No invitations yet"
          description="Employers can invite you privately when your profile is public. Keep your skills and availability up to date."
          action={<ButtonLink href="/candidate/profile">Update your profile</ButtonLink>}
        />
      )}
    </>
  );
}

function InvitationCard({
  invitation,
  onChanged,
}: {
  invitation: Invitation;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(status: "ACCEPTED" | "DECLINED") {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/invitations/${invitation.id}`, { method: "PATCH", body: { status } });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-ink-950">
              <Link href={`/jobs/${invitation.job.id}`} className="hover:text-primary-700">
                {invitation.job.title}
              </Link>
            </h2>
            <p className="text-sm text-ink-600">
              {invitation.job.company.name}
              {invitation.employer?.name ? ` · invited by ${invitation.employer.name}` : ""}
              {invitation.employer?.title ? `, ${invitation.employer.title}` : ""}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">{formatRelative(invitation.createdAt)}</p>
          </div>
          <InvitationStatusBadge status={invitation.status} />
        </div>

        {invitation.message && (
          <blockquote className="mt-4 border-l-2 border-primary-200 pl-3 text-sm text-ink-700">
            {invitation.message}
          </blockquote>
        )}

        {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}

        {invitation.status === "PENDING" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => respond("ACCEPTED")}>
              Accept and apply
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => respond("DECLINED")}
            >
              Decline
            </Button>
            <ButtonLink href={`/jobs/${invitation.job.id}`} size="sm" variant="ghost">
              View opportunity
            </ButtonLink>
          </div>
        )}
      </div>
    </Card>
  );
}
