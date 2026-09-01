"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { JobCard } from "@/components/jobs/JobCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import { AVAILABILITY_LABELS, formatRelative } from "@/lib/format";
import type { Application, Invitation, JobSummary, Paginated, SessionUser } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function CandidateDashboardScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["CANDIDATE"]}>{(user) => <CandidateDashboard user={user} />}</AuthGate>
    </Container>
  );
}

function CandidateDashboard({ user }: { user: SessionUser }) {
  const applications = useApiQuery<Paginated<Application>>("/api/applications", { pageSize: 5 });
  const invitations = useApiQuery<Paginated<Invitation>>("/api/invitations", {
    status: "PENDING",
    pageSize: 5,
  });
  const jobs = useApiQuery<Paginated<JobSummary>>("/api/jobs", { pageSize: 4 });

  const completion = user.candidate?.profileCompletion ?? 0;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Everything you need to find work quickly."
        action={<ButtonLink href="/jobs">Find jobs</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Profile completion"
          value={`${completion}%`}
          hint={completion === 100 ? "Your profile is complete" : "Finish it to get noticed"}
          href="/candidate/profile"
        />
        <StatCard
          label="Applications"
          value={applications.data?.meta.total ?? "—"}
          href="/candidate/applications"
        />
        <StatCard
          label="Pending invitations"
          value={invitations.data?.meta.total ?? "—"}
          href="/candidate/invitations"
        />
      </div>

      <div className="mt-4">
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-500">Your availability</p>
              <p className="mt-1 flex items-center gap-2 font-medium text-ink-900">
                {user.candidate ? AVAILABILITY_LABELS[user.candidate.availability] : "—"}
                {user.candidate?.availability === "AVAILABLE_NOW" && (
                  <Badge tone="available">Visible to employers hiring now</Badge>
                )}
              </p>
            </div>
            <ButtonLink href="/candidate/profile" variant="secondary" size="sm">
              Update availability
            </ButtonLink>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-label="Private invitations">
          <Card>
            <CardHeader
              title="Private invitations"
              description="Opportunities employers offered you directly."
              action={
                <Link
                  href="/candidate/invitations"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  See all
                </Link>
              }
            />
            <CardBody className="p-0">
              {invitations.loading ? (
                <LoadingState className="border-0" />
              ) : invitations.error ? (
                <ErrorState
                  className="border-0"
                  message={errorMessage(invitations.error)}
                  onRetry={invitations.reload}
                />
              ) : invitations.data && invitations.data.items.length > 0 ? (
                <ul className="divide-y divide-ink-100">
                  {invitations.data.items.map((invitation) => (
                    <li key={invitation.id} className="px-5 py-4">
                      <Link
                        href="/candidate/invitations"
                        className="font-medium text-ink-900 hover:text-primary-700"
                      >
                        {invitation.job.title}
                      </Link>
                      <p className="text-sm text-ink-500">
                        {invitation.job.company.name} · {formatRelative(invitation.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  className="border-0"
                  title="No invitations yet"
                  description="Employers can invite you privately when your profile is public and available."
                />
              )}
            </CardBody>
          </Card>
        </section>

        <section aria-label="Recent applications">
          <Card>
            <CardHeader
              title="Your applications"
              action={
                <Link
                  href="/candidate/applications"
                  className="text-sm font-medium text-primary-700 hover:underline"
                >
                  See all
                </Link>
              }
            />
            <CardBody className="p-0">
              {applications.loading ? (
                <LoadingState className="border-0" />
              ) : applications.error ? (
                <ErrorState
                  className="border-0"
                  message={errorMessage(applications.error)}
                  onRetry={applications.reload}
                />
              ) : applications.data && applications.data.items.length > 0 ? (
                <ul className="divide-y divide-ink-100">
                  {applications.data.items.map((application) => (
                    <li
                      key={application.id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/jobs/${application.job.id}`}
                          className="font-medium text-ink-900 hover:text-primary-700"
                        >
                          {application.job.title}
                        </Link>
                        <p className="truncate text-sm text-ink-500">
                          {application.job.company.name} · {formatRelative(application.createdAt)}
                        </p>
                      </div>
                      <ApplicationStatusBadge status={application.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  className="border-0"
                  title="No applications yet"
                  description="Find a role and apply — most employers reply within a few days."
                  action={<ButtonLink href="/jobs">Browse jobs</ButtonLink>}
                />
              )}
            </CardBody>
          </Card>
        </section>
      </div>

      <section className="mt-8" aria-label="Latest jobs">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-lg font-semibold text-ink-900">Latest jobs</h2>
          <Link href="/candidate/jobs" className="text-sm font-medium text-primary-700 hover:underline">
            Jobs for you
          </Link>
        </div>
        {jobs.loading ? (
          <LoadingState />
        ) : jobs.error ? (
          <ErrorState message={errorMessage(jobs.error)} onRetry={jobs.reload} />
        ) : jobs.data && jobs.data.items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.data.items.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyState title="No jobs published yet" />
        )}
      </section>
    </>
  );
}
