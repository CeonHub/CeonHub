import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CompanyLogo } from "@/components/companies/CompanyLogo";
import { DualCta } from "@/components/home/DualCta";
import { HomeHero } from "@/components/home/HomeHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PrivateHiring } from "@/components/home/PrivateHiring";
import { WorkTypes, type WorkType } from "@/components/home/WorkTypes";
import { apiFetch } from "@/lib/api";
import type { Company, JobSummary, Paginated } from "@/lib/types";

export const metadata: Metadata = {
  title: "CeonHub: Find work. Hire talent. Connect privately.",
  description:
    "A US hiring marketplace built for speed: immediate starts, freelance projects, side income, internships, and private opportunities you can only reach by invitation.",
  alternates: { canonical: "/" },
};

/**
 * Rendered per request, with each API call cached for five minutes (see the
 * `revalidate` options below). Prerendering the whole page at build time would bake
 * in whatever the API returned during the build, including nothing at all, if the
 * API was not reachable yet.
 */
export const dynamic = "force-dynamic";

const WORK_TYPE_DEFINITIONS: Array<{
  href: string;
  query: Record<string, string>;
  title: string;
  description: string;
}> = [
  {
    href: "/jobs?immediateHire=true",
    query: { immediateHire: "true" },
    title: "Immediate start",
    description: "Employers who need someone this week, not next quarter.",
  },
  {
    href: "/jobs?freelance=true",
    query: { freelance: "true" },
    title: "Freelance",
    description: "Projects and contracts, remote or on site.",
  },
  {
    href: "/jobs?sideIncome=true",
    query: { sideIncome: "true" },
    title: "Side income",
    description: "Work that fits around a job, studies or family.",
  },
  {
    href: "/jobs?internship=true",
    query: { internship: "true" },
    title: "Internships",
    description: "Early-career roles with real responsibility.",
  },
];

async function countJobs(query: Record<string, string>): Promise<number | null> {
  return apiFetch<Paginated<JobSummary>>("/api/jobs", {
    query: { ...query, pageSize: 1 },
    revalidate: 300,
  })
    .then((result) => result.meta.total)
    .catch(() => null);
}

export default async function HomePage() {
  const [latestJobs, companies, counts] = await Promise.all([
    apiFetch<Paginated<JobSummary>>("/api/jobs", { query: { pageSize: 4 }, revalidate: 300 })
      .then((result) => result.items)
      .catch(() => [] as JobSummary[]),
    apiFetch<Paginated<Company>>("/api/companies", { query: { pageSize: 6 }, revalidate: 300 })
      .then((result) => result.items)
      .catch(() => [] as Company[]),
    Promise.all(WORK_TYPE_DEFINITIONS.map((definition) => countJobs(definition.query))),
  ]);

  const workTypes: WorkType[] = WORK_TYPE_DEFINITIONS.map((definition, index) => ({
    href: definition.href,
    title: definition.title,
    description: definition.description,
    count: counts[index] ?? null,
  }));

  return (
    <main className="bg-white">
      <HomeHero latestJobs={latestJobs} />
      <WorkTypes types={workTypes} />

      {companies.length > 0 && (
        <section className="py-20 lg:py-24" aria-label="Companies hiring">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-section text-ink-950">Companies hiring now</h2>
              <Link
                href="/companies"
                className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                All companies
              </Link>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <li key={company.id}>
                  <Link
                    href={`/companies/${company.slug}`}
                    className="flex items-center gap-4 rounded-card bg-ink-50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lift"
                  >
                    <CompanyLogo name={company.name} logoUrl={company.logoUrl ?? null} />
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink-950">{company.name}</span>
                      <span className="block text-sm text-ink-600">
                        {company.openJobCount ?? 0} open{" "}
                        {(company.openJobCount ?? 0) === 1 ? "role" : "roles"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <PrivateHiring />
      <HowItWorks />
      <DualCta />
    </main>
  );
}
