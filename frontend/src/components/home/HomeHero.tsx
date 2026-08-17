import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { formatLocation, formatRelative } from "@/lib/format";
import type { JobSummary } from "@/lib/types";

/**
 * The hero doubles as the entry point to search: a real keyword field that lands on
 * /jobs, next to a live panel of the newest roles rather than a stock illustration.
 */
export function HomeHero({ latestJobs }: { latestJobs: JobSummary[] }) {
  return (
    <section className="border-b border-ink-200 bg-white">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase">
            Hiring and work marketplace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Find work. Hire talent.
            <br />
            Connect privately.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-600">
            CeonHub is built for speed: immediate starts, freelance projects, side income and
            internships — plus private opportunities that never appear in public search.
          </p>

          <form action="/jobs" method="get" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="hero-q" className="sr-only">
              What work are you looking for?
            </label>
            <input
              id="hero-q"
              name="q"
              type="text"
              placeholder="Job title, skill or company"
              className="w-full rounded-md border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400"
            />
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Search jobs
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/jobs" size="lg">
              Find Jobs
            </ButtonLink>
            <ButtonLink href="/register?role=EMPLOYER" size="lg" variant="secondary">
              Hire Talent
            </ButtonLink>
          </div>
        </div>

        <aside className="rounded-card border border-ink-200 bg-ink-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Latest opportunities</h2>
            <Link href="/jobs" className="text-sm font-medium text-brand-700 hover:underline">
              See all
            </Link>
          </div>

          {latestJobs.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {latestJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block rounded-md border border-ink-200 bg-white p-3 transition-colors hover:border-brand-300"
                  >
                    <p className="flex items-center gap-2 font-medium text-ink-900">
                      {job.title}
                      {job.immediateHire && (
                        <span className="rounded-full bg-immediate-100 px-2 py-0.5 text-xs font-medium text-immediate-700">
                          Immediate
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {job.company.name} · {formatLocation(job.location, job.remote)} ·{" "}
                      {formatRelative(job.publishedAt ?? job.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-md border border-dashed border-ink-300 bg-white p-4 text-sm text-ink-500">
              No jobs published yet. If you are running this locally, seed the demo data with{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-xs">npm run db:seed</code>
              .
            </p>
          )}
        </aside>
      </Container>
    </section>
  );
}
