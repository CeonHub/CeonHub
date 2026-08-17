import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters, type JobFilterValues } from "@/components/jobs/JobFilters";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { apiFetch, buildQuery, errorMessage } from "@/lib/api";
import type { JobSummary, Paginated } from "@/lib/types";

export const metadata: Metadata = {
  title: "Browse jobs",
  description:
    "Search immediate-start roles, freelance work, side income, internships and full-time jobs on CeonHub.",
  alternates: { canonical: "/jobs" },
};

const FILTER_KEYS = [
  "q",
  "location",
  "remote",
  "employmentType",
  "category",
  "immediateHire",
  "freelance",
  "internship",
  "sideIncome",
] as const;

type SearchParams = Record<string, string | string[] | undefined>;

/** Takes only the parameters we understand, as single strings. */
function readFilters(params: SearchParams): JobFilterValues {
  const values: JobFilterValues = {};
  for (const key of FILTER_KEYS) {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single) values[key] = single;
  }
  return values;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = readFilters(params);
  const pageParam = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);

  const [result, categories] = await Promise.all([
    apiFetch<Paginated<JobSummary>>("/api/jobs", { query: { ...filters, page, pageSize: 20 } })
      .then((data) => ({ data, error: null }))
      .catch((error: unknown) => ({ data: null, error })),
    apiFetch<{ categories: string[] }>("/api/jobs/meta", { revalidate: 3600 })
      .then((data) => data.categories)
      .catch(() => [] as string[]),
  ]);

  function hrefForPage(nextPage: number): string {
    return `/jobs${buildQuery({ ...filters, page: nextPage })}`;
  }

  return (
    <Container className="py-10">
      <PageHeader
        title="Browse jobs"
        description="Immediate work, freelance projects, internships and full-time roles."
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside>
          <JobFilters categories={categories} values={filters} />
        </aside>

        <section aria-label="Search results">
          {result.error ? (
            <ErrorState message={errorMessage(result.error)} />
          ) : result.data && result.data.items.length > 0 ? (
            <>
              <p className="pb-3 text-sm text-ink-500">
                {result.data.meta.total} {result.data.meta.total === 1 ? "job" : "jobs"} found
              </p>
              <div className="space-y-3">
                {result.data.items.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              <Pagination
                className="mt-8"
                page={result.data.meta.page}
                totalPages={result.data.meta.totalPages}
                hrefFor={hrefForPage}
              />
            </>
          ) : (
            <EmptyState
              title="No jobs match those filters"
              description="Try removing a filter or searching for a broader keyword."
            />
          )}
        </section>
      </div>
    </Container>
  );
}
