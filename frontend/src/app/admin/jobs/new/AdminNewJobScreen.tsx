"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobForm } from "@/components/jobs/JobForm";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import type { AdminCompanyRow, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function AdminNewJobScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["ADMIN"]}>
        {() => (
          <Suspense fallback={<LoadingState />}>
            <AdminNewJob />
          </Suspense>
        )}
      </AuthGate>
    </Container>
  );
}

function AdminNewJob() {
  // /admin/companies links here with the company pre-selected.
  const preselected = useSearchParams().get("companyId");

  const meta = useApiQuery<{ categories: string[] }>("/api/jobs/meta");
  const companies = useApiQuery<Paginated<AdminCompanyRow>>("/api/admin/companies", {
    pageSize: 50,
  });

  const items = companies.data?.items ?? [];
  // The requested company first, so it is the select's default value.
  const ordered = preselected
    ? [...items].sort((a, b) =>
        a.id === preselected ? -1 : b.id === preselected ? 1 : 0,
      )
    : items;

  return (
    <>
      <PageHeader
        title="Post a job"
        description="Staff post under any company, including CeonHub's own. Publish straight away or leave it as a draft."
      />

      {meta.loading || companies.loading ? (
        <LoadingState />
      ) : meta.error ? (
        <ErrorState message={errorMessage(meta.error)} onRetry={meta.reload} />
      ) : companies.error ? (
        <ErrorState message={errorMessage(companies.error)} onRetry={companies.reload} />
      ) : ordered.length === 0 ? (
        <Alert tone="info" title="Add a company first">
          <p>Every job is published under a company, and there are none yet.</p>
          <ButtonLink href="/admin/companies" size="sm" className="mt-3">
            Go to companies
          </ButtonLink>
        </Alert>
      ) : (
        <JobForm
          categories={meta.data?.categories ?? []}
          companies={ordered.map((company) => ({ id: company.id, name: company.name }))}
          manageBasePath="/admin/jobs"
        />
      )}
    </>
  );
}
