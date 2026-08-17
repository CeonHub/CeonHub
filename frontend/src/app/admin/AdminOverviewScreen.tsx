"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function AdminOverviewScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["ADMIN"]}>{() => <AdminOverview />}</AuthGate>
    </Container>
  );
}

function AdminOverview() {
  const query = useApiQuery<{ stats: AdminStats }>("/api/admin/stats");

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="A quick read on how CeonHub is being used."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/admin/users" variant="secondary">
              Users
            </ButtonLink>
            <ButtonLink href="/admin/jobs" variant="secondary">
              Jobs
            </ButtonLink>
          </div>
        }
      />

      {query.loading ? (
        <LoadingState />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data ? (
        <div className="space-y-8">
          <Section title="Users">
            <StatCard label="Total" value={query.data.stats.users.total} href="/admin/users" />
            <StatCard label="Candidates" value={query.data.stats.users.candidates} />
            <StatCard label="Employers" value={query.data.stats.users.employers} />
            <StatCard label="Disabled" value={query.data.stats.users.disabled} />
          </Section>

          <Section title="Jobs">
            <StatCard label="Total" value={query.data.stats.jobs.total} href="/admin/jobs" />
            <StatCard label="Published" value={query.data.stats.jobs.published} />
            <StatCard label="Drafts" value={query.data.stats.jobs.draft} />
            <StatCard
              label="Private"
              value={query.data.stats.jobs.private}
              hint="Not in public search"
            />
            <StatCard label="Hidden by admin" value={query.data.stats.jobs.hidden} />
          </Section>

          <Section title="Activity">
            <StatCard label="Applications" value={query.data.stats.applications.total} />
            <StatCard label="Applications, last 7 days" value={query.data.stats.applications.last7Days} />
            <StatCard label="Invitations" value={query.data.stats.invitations.total} />
            <StatCard label="Invitations pending" value={query.data.stats.invitations.pending} />
          </Section>
        </div>
      ) : null}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="pb-3 text-lg font-semibold text-ink-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}
