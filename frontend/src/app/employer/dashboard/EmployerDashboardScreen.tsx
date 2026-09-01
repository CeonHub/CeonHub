"use client";

import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge";
import { InvitationStatusBadge } from "@/components/invitations/InvitationStatusBadge";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import type { Application, Invitation, JobSummary, Paginated, SessionUser } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function EmployerDashboardScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{(user) => <EmployerDashboard user={user} />}</AuthGate>
    </Container>
  );
}

function EmployerDashboard({ user }: { user: SessionUser }) {
  const hasCompany = Boolean(user.employer?.company);

  const activeJobs = useApiQuery<Paginated<JobSummary>>(hasCompany ? "/api/jobs/mine" : null, {
    status: "PUBLISHED",
    pageSize: 5,
  });
  const applications = useApiQuery<Paginated<Application>>(hasCompany ? "/api/applications" : null, {
    pageSize: 5,
  });
  const invitations = useApiQuery<Paginated<Invitation>>(hasCompany ? "/api/invitations" : null, {
    pageSize: 5,
  });

  if (!hasCompany) {
    return (
      <>
        <PageHeader title="Welcome to CeonHub" description="One step before you can start hiring." />
        <Alert tone="info" title="Create your company profile">
          <p>
            Jobs and invitations are published under a company. Set yours up and you can post your
            first role straight away.
          </p>
          <ButtonLink href="/employer/profile" size="sm" className="mt-3">
            Create company profile
          </ButtonLink>
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${user.employer?.company?.name ?? "Your company"}`}
        description="Active roles, new applicants and the invitations you have sent."
        action={<ButtonLink href="/employer/jobs/new">Post a job</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active jobs"
          value={activeJobs.data?.meta.total ?? "—"}
          href="/employer/jobs"
        />
        <StatCard
          label="Applications"
          value={applications.data?.meta.total ?? "—"}
          href="/employer/applications"
        />
        <StatCard
          label="Invitations sent"
          value={invitations.data?.meta.total ?? "—"}
          href="/employer/invitations"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Active jobs"
            action={
              <Link href="/employer/jobs" className="text-sm font-medium text-primary-700 hover:underline">
                Manage jobs
              </Link>
            }
          />
          <CardBody className="p-0">
            {activeJobs.loading ? (
              <LoadingState className="border-0" />
            ) : activeJobs.error ? (
              <ErrorState
                className="border-0"
                message={errorMessage(activeJobs.error)}
                onRetry={activeJobs.reload}
              />
            ) : activeJobs.data && activeJobs.data.items.length > 0 ? (
              <ul className="divide-y divide-ink-100">
                {activeJobs.data.items.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <Link
                        href={`/employer/jobs/${job.id}`}
                        className="font-medium text-ink-900 hover:text-primary-700"
                      >
                        {job.title}
                      </Link>
                      <p className="text-sm text-ink-500">
                        {job.applicationCount ?? 0} applicant
                        {(job.applicationCount ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <JobStatusBadge status={job.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="border-0"
                title="No published jobs"
                description="Publish a role and candidates can start applying immediately."
                action={<ButtonLink href="/employer/jobs/new">Post a job</ButtonLink>}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent applicants"
            action={
              <Link
                href="/employer/applications"
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
                      <p className="font-medium text-ink-900">
                        {application.candidate?.name ?? "Candidate"}
                      </p>
                      <p className="truncate text-sm text-ink-500">
                        {application.job.title} · {formatRelative(application.createdAt)}
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
                description="Invite candidates directly if you need someone quickly."
                action={<ButtonLink href="/employer/candidates">Find candidates</ButtonLink>}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <section className="mt-6" aria-label="Invitations">
        <Card>
          <CardHeader
            title="Private invitations"
            description="Candidates you approached directly."
            action={
              <Link
                href="/employer/invitations"
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
                  <li
                    key={invitation.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">{invitation.candidate?.name}</p>
                      <p className="truncate text-sm text-ink-500">
                        {invitation.job.title} · {formatRelative(invitation.createdAt)}
                      </p>
                    </div>
                    <InvitationStatusBadge status={invitation.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="border-0"
                title="No invitations sent"
                description="Search the candidate directory and invite someone to a private opportunity."
                action={<ButtonLink href="/employer/candidates">Find candidates</ButtonLink>}
              />
            )}
          </CardBody>
        </Card>
      </section>
    </>
  );
}
