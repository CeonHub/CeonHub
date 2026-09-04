"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input, CONTROL_BORDER, CONTROL_CLASSES } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { ApiError, apiFetch, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { AdminCompanyRow, Company, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function AdminCompaniesScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["ADMIN"]}>{() => <AdminCompanies />}</AuthGate>
    </Container>
  );
}

function AdminCompanies() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const query = useApiQuery<Paginated<AdminCompanyRow>>("/api/admin/companies", {
    q: search || undefined,
    page,
    pageSize: 25,
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(String(new FormData(event.currentTarget).get("q") ?? ""));
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Companies"
        description="Jobs are always published under a company. Staff can create one for an employer being onboarded by hand, or for CeonHub itself."
        action={
          <Button variant={creating ? "ghost" : "primary"} onClick={() => setCreating(!creating)}>
            {creating ? "Cancel" : "Add company"}
          </Button>
        }
      />

      {creating && (
        <NewCompanyForm
          onCreated={() => {
            setCreating(false);
            query.reload();
          }}
        />
      )}

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-wrap gap-3 rounded-card border border-ink-200 bg-white p-5"
        role="search"
      >
        <input
          name="q"
          type="text"
          defaultValue={search}
          placeholder="Company name"
          aria-label="Search companies"
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "w-72")}
        />
        <Button type="submit">Search</Button>
      </form>

      {query.loading ? (
        <LoadingState label="Loading companies…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <Card>
            <ul className="divide-y divide-ink-100">
              {query.data.items.map((company) => (
                <li
                  key={company.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">
                      <Link
                        href={`/companies/${company.slug}`}
                        className="hover:text-primary-700"
                      >
                        {company.name}
                      </Link>
                    </p>
                    <p className="text-sm text-ink-500">
                      {[company.location, company.country].filter(Boolean).join(", ") ||
                        "No location"}{" "}
                      · {company.jobCount} job{company.jobCount === 1 ? "" : "s"} ·{" "}
                      {company.publishedJobCount} published · added {formatDate(company.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {company.publishedJobCount === 0 && <Badge>No public jobs</Badge>}
                    <ButtonLink
                      href={`/admin/jobs/new?companyId=${company.id}`}
                      variant="secondary"
                      size="sm"
                    >
                      Post a job
                    </ButtonLink>
                  </div>
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
          title={search ? "No companies match this search" : "No companies yet"}
          description={
            search
              ? undefined
              : "Add one before posting a job. CeonHub's own company is what the careers page reads."
          }
          action={
            search ? undefined : <Button onClick={() => setCreating(true)}>Add company</Button>
          }
        />
      )}
    </>
  );
}

interface CompanyFormValues {
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  location: string;
  country: string;
}

const EMPTY: CompanyFormValues = {
  name: "",
  description: "",
  website: "",
  logoUrl: "",
  location: "",
  country: "United States",
};

function NewCompanyForm({ onCreated }: { onCreated: () => void }) {
  const [values, setValues] = useState<CompanyFormValues>(EMPTY);
  const [error, setError] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Company | null>(null);

  function update<K extends keyof CompanyFormValues>(field: K, value: CompanyFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const fieldError = (field: string) =>
    error instanceof ApiError ? error.fieldError(field) : undefined;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ company: Company }>("/api/companies", {
        method: "POST",
        body: values,
      });
      setCreated(result.company);
      setValues(EMPTY);
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(errorMessage(caught)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6" noValidate>
      <Card>
        <CardHeader
          title="New company"
          description="The name decides the public URL. Everything else can be edited later."
        />
        <CardBody className="space-y-5">
          {error && <Alert tone="error">{errorMessage(error)}</Alert>}
          {created && (
            <Alert tone="success">
              {created.name} created at /companies/{created.slug}.
            </Alert>
          )}

          <Field htmlFor="name" label="Company name" error={fieldError("name")} required>
            <Input
              id="name"
              value={values.name}
              error={fieldError("name")}
              onChange={(event) => update("name", event.target.value)}
              placeholder="CeonHub"
              required
            />
          </Field>

          <Field htmlFor="description" label="About" error={fieldError("description")}>
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              error={fieldError("description")}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field htmlFor="website" label="Website" error={fieldError("website")}>
              <Input
                id="website"
                value={values.website}
                error={fieldError("website")}
                onChange={(event) => update("website", event.target.value)}
                placeholder="https://www.ceonhub.net"
              />
            </Field>

            <Field htmlFor="logoUrl" label="Logo URL" error={fieldError("logoUrl")}>
              <Input
                id="logoUrl"
                value={values.logoUrl}
                error={fieldError("logoUrl")}
                onChange={(event) => update("logoUrl", event.target.value)}
                placeholder="https://…"
              />
            </Field>

            <Field htmlFor="location" label="Location" error={fieldError("location")}>
              <Input
                id="location"
                value={values.location}
                error={fieldError("location")}
                onChange={(event) => update("location", event.target.value)}
                placeholder="Remote, United States"
              />
            </Field>

            <Field htmlFor="country" label="Country" error={fieldError("country")}>
              <Input
                id="country"
                value={values.country}
                error={fieldError("country")}
                onChange={(event) => update("country", event.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={busy} disabled={busy}>
              Create company
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
