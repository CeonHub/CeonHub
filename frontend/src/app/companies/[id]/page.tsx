import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CompanyLogo } from "@/components/companies/CompanyLogo";
import { JobCard } from "@/components/jobs/JobCard";
import { EmptyState } from "@/components/ui/States";
import { ApiError, apiFetch } from "@/lib/api";
import type { Company, JobSummary, Paginated } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Accepts either the company id or its slug, so URLs stay readable. */
async function loadCompany(idOrSlug: string): Promise<Company | null> {
  try {
    const data = await apiFetch<{ company: Company }>(`/api/companies/${idOrSlug}`, {
      revalidate: 300,
    });
    return data.company;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const company = await loadCompany(id);

  if (!company) return { title: "Company not found", robots: { index: false } };

  const description =
    company.description?.slice(0, 155).replace(/\s+/g, " ").trim() ??
    `See open roles at ${company.name} on CeonHub.`;

  return {
    title: `${company.name} — jobs and company profile`,
    description,
    alternates: { canonical: `/companies/${company.slug}` },
    openGraph: { type: "profile", title: company.name, description },
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { id } = await params;
  const company = await loadCompany(id);

  if (!company) notFound();

  const jobs = await apiFetch<Paginated<JobSummary>>("/api/jobs", {
    query: { companyId: company.id, pageSize: 50 },
    revalidate: 60,
  }).catch(() => null);

  return (
    <Container className="py-10">
      <header className="flex flex-wrap items-start gap-5">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl ?? null} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold text-ink-900">{company.name}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {[company.location, company.country].filter(Boolean).join(", ") ||
              "Location not specified"}
          </p>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer nofollow"
              className="mt-2 inline-block text-sm font-medium text-primary-700 hover:underline"
            >
              {company.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </header>

      {company.description && (
        <section className="mt-8 max-w-3xl" aria-label="About">
          <h2 className="text-sm font-semibold text-ink-900">About</h2>
          <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-7 text-ink-700">
            {company.description}
          </p>
        </section>
      )}

      <section className="mt-10" aria-label="Open roles">
        <h2 className="text-lg font-semibold text-ink-900">
          Open roles {jobs ? `(${jobs.meta.total})` : ""}
        </h2>

        <div className="mt-4 space-y-3">
          {jobs && jobs.items.length > 0 ? (
            jobs.items.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <EmptyState
              title="No public roles right now"
              description={`${company.name} has no open public jobs at the moment.`}
            />
          )}
        </div>
      </section>
    </Container>
  );
}
