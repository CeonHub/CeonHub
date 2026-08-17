"use client";

import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { Button } from "@/components/ui/Button";
import { CONTROL_BORDER, CONTROL_CLASSES } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/api";
import { AVAILABILITY_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/lib/format";
import type { Availability, CandidateSummary, EmploymentType, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { InviteCandidateModal } from "./InviteCandidateModal";

export function EmployerCandidatesScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{() => <EmployerCandidates />}</AuthGate>
    </Container>
  );
}

function EmployerCandidates() {
  const [filters, setFilters] = useState<{
    q: string;
    availability: Availability | "";
    employmentType: EmploymentType | "";
    country: string;
  }>({ q: "", availability: "", employmentType: "", country: "" });
  const [page, setPage] = useState(1);
  const [inviting, setInviting] = useState<CandidateSummary | null>(null);

  const query = useApiQuery<Paginated<CandidateSummary>>("/api/candidates", {
    q: filters.q || undefined,
    availability: filters.availability || undefined,
    employmentType: filters.employmentType || undefined,
    country: filters.country || undefined,
    page,
    pageSize: 20,
  });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFilters({
      q: String(data.get("q") ?? ""),
      availability: (data.get("availability") as Availability | null) ?? "",
      employmentType: (data.get("employmentType") as EmploymentType | null) ?? "",
      country: String(data.get("country") ?? ""),
    });
    setPage(1);
  }

  return (
    <>
      <PageHeader
        title="Find candidates"
        description="Only candidates who made their profile public are listed here."
      />

      <form
        onSubmit={handleSearch}
        className="mb-6 grid gap-3 rounded-card border border-ink-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
        role="search"
      >
        <input
          name="q"
          type="text"
          defaultValue={filters.q}
          placeholder="Name, headline or bio"
          aria-label="Search candidates"
          className={cn(CONTROL_CLASSES, CONTROL_BORDER, "lg:col-span-2")}
        />
        <Select
          id="availability"
          name="availability"
          aria-label="Availability"
          placeholder="Any availability"
          defaultValue={filters.availability}
          options={Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Select
          id="employmentType"
          name="employmentType"
          aria-label="Looking for"
          placeholder="Any work type"
          defaultValue={filters.employmentType}
          options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Button type="submit">Search</Button>
      </form>

      {query.loading ? (
        <LoadingState label="Searching candidates…" />
      ) : query.error ? (
        <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
      ) : query.data && query.data.items.length > 0 ? (
        <>
          <p className="pb-3 text-sm text-ink-500">{query.data.meta.total} candidates</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {query.data.items.map((candidate) => (
              <CandidateCard
                key={candidate.userId}
                candidate={candidate}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setInviting(candidate)}>
                    Invite
                  </Button>
                }
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
          title="No candidates match this search"
          description="Try a broader search — or post a public job so candidates can find you."
        />
      )}

      <InviteCandidateModal candidate={inviting} onClose={() => setInviting(null)} />
    </>
  );
}
