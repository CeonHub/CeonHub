import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CompanyLogo } from "@/components/companies/CompanyLogo";
import { JobCard } from "@/components/jobs/JobCard";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EmptyState } from "@/components/ui/States";
import { apiFetch } from "@/lib/api";
import { CAREERS_COMPANY_SLUG } from "@/lib/env";
import type { Company, JobSummary, Paginated } from "@/lib/types";

export const metadata: Metadata = {
  title: "Careers at CeonHub",
  description:
    "Open roles on the team building CeonHub: engineering, design and support, remote across the United States.",
  alternates: { canonical: "/careers" },
  openGraph: {
    type: "website",
    title: "Careers at CeonHub",
    description: "Open roles on the team building CeonHub.",
  },
};

/**
 * Rendered per request with a short cache. The company row can be created or
 * edited from the admin console at any time, so baking this at build time would
 * pin the page to whatever existed then.
 */
export const dynamic = "force-dynamic";

/**
 * What working here involves. Static copy rather than a CMS: it changes about as
 * often as the rest of the marketing pages, which are also code.
 */
const WHAT_TO_EXPECT = [
  {
    title: "A small team, whole problems",
    body: "You own a feature from the database columns to the empty states. Nobody hands you a ticket with the thinking already done.",
  },
  {
    title: "Remote across US time zones",
    body: "We work from wherever we are, with a few hours of overlap each day so decisions do not wait overnight.",
  },
  {
    title: "The product is the marketplace",
    body: "Everything we ship is visible on this site the same week. So are the mistakes, which is a good reason to be careful.",
  },
];

/**
 * A company row that does not exist yet (a fresh deployment, before staff create
 * it) and an unreachable API both land this page on its "no open roles" state.
 * Neither is worth a 404: the page is the pitch as much as the list.
 */
async function loadCompany(): Promise<Company | null> {
  return apiFetch<{ company: Company }>(`/api/companies/${CAREERS_COMPANY_SLUG}`, {
    revalidate: 300,
  })
    .then((data) => data.company)
    .catch(() => null);
}

export default async function CareersPage() {
  const company = await loadCompany();

  const jobs = company
    ? await apiFetch<Paginated<JobSummary>>("/api/jobs", {
        query: { companyId: company.id, pageSize: 50 },
        revalidate: 60,
      }).catch(() => null)
    : null;

  const openRoles = jobs?.items ?? [];

  return (
    <main className="bg-white">
      <section className="border-b border-ink-200 bg-ink-50">
        <Container className="py-16 lg:py-20">
          <Eyebrow>Careers at CeonHub</Eyebrow>

          <h1 className="text-display mt-6 max-w-3xl text-ink-950">
            We are building the marketplace we wanted to use.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-700">
            CeonHub connects US employers who need people quickly with candidates who want work
            quickly. It is a small team, an intentionally small codebase, and a product where the
            details are the whole thing.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="#open-roles" size="lg">
              See open roles
            </ButtonLink>
            <ButtonLink href="/about" variant="secondary" size="lg">
              About CeonHub
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20" aria-label="What to expect">
        <Container>
          <h2 className="text-section text-ink-950">What working here looks like</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_TO_EXPECT.map((item) => (
              <div key={item.title} className="rounded-card bg-ink-50 p-6">
                <h3 className="text-lg font-bold tracking-tight text-ink-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="open-roles" className="scroll-mt-24 pb-20 lg:pb-24" aria-label="Open roles">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-section text-ink-950">
              Open roles {openRoles.length > 0 && `(${openRoles.length})`}
            </h2>
            {company && (
              <Link
                href={`/companies/${company.slug}`}
                className="text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                CeonHub company profile
              </Link>
            )}
          </div>

          <div className="mt-8 space-y-3">
            {openRoles.length > 0 ? (
              openRoles.map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <EmptyState
                title="No open roles right now"
                description="We are not hiring for anything at the moment. New roles are posted here first, and the job index below is always open."
                action={<ButtonLink href="/jobs">Browse all jobs on CeonHub</ButtonLink>}
              />
            )}
          </div>

          {company && (
            <div className="mt-12 flex flex-wrap items-center gap-5 rounded-card border border-ink-200 bg-ink-50 p-6">
              <CompanyLogo
                name={company.name}
                logoUrl={company.logoUrl ?? null}
                className="h-14 w-14"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink-950">{company.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">
                  {company.description ??
                    "The hiring and work marketplace this site runs on."}
                </p>
              </div>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
