import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { apiFetch, buildQuery, errorMessage } from "@/lib/api";
import type { Company, Paginated } from "@/lib/types";

export const metadata: Metadata = {
  title: "Companies hiring",
  description: "Browse the companies hiring on CeonHub and see their open roles.",
  alternates: { canonical: "/companies" },
};

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);

  const result = await apiFetch<Paginated<Company>>("/api/companies", {
    query: { q, page, pageSize: 24 },
  })
    .then((data) => ({ data, error: null as unknown }))
    .catch((error: unknown) => ({ data: null, error }));

  return (
    <Container className="py-10">
      <PageHeader
        title="Companies hiring on CeonHub"
        description="Only companies with at least one open public role are listed."
      />

      <form className="mb-6 flex gap-2" role="search">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search companies"
          aria-label="Search companies"
          className="w-full max-w-sm rounded-md border border-ink-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </form>

      {result.error ? (
        <ErrorState message={errorMessage(result.error)} />
      ) : result.data && result.data.items.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.data.items.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
          <Pagination
            className="mt-8"
            page={result.data.meta.page}
            totalPages={result.data.meta.totalPages}
            hrefFor={(nextPage) => `/companies${buildQuery({ q, page: nextPage })}`}
          />
        </>
      ) : (
        <EmptyState
          title="No companies to show yet"
          description="Companies appear here once they publish their first public job."
        />
      )}
    </Container>
  );
}
