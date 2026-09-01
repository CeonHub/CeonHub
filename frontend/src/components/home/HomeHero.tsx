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
    <section className="relative overflow-hidden border-b border-ink-200 bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(60rem 30rem at 8% -10%, var(--primary-logo), transparent 60%), " +
            "radial-gradient(45rem 26rem at 92% 8%, var(--secondary-logo), transparent 60%)",
        }}
      />
      <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold tracking-wide text-primary-800 uppercase">
            <span aria-hidden="true" className="brand-gradient h-2 w-2 rounded-full" />
            Hiring and work marketplace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Find work. Hire talent.
            <br />
            <span className="text-primary-700">Connect privately.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-600">
            CeonHub is built for speed: immediate starts, freelance projects, side income and
            internships across the US — plus private opportunities that never appear in public
            search.
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
              className="w-full rounded-md border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 transition-colors placeholder:text-ink-400 focus:border-primary-500"
            />
            <button
              type="submit"
              className="rounded-md border border-brand-edge bg-brand px-6 py-3 text-sm font-medium whitespace-nowrap text-brand-fg shadow-card transition-colors hover:bg-brand-hover"
            >
              Search jobs
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/jobs" size="lg">
              Find Jobs
            </ButtonLink>
            <ButtonLink href="/register?role=EMPLOYER" size="lg" variant="accent">
              Hire Talent
            </ButtonLink>
          </div>
        </div>

        <aside className="rounded-card border border-ink-200 bg-ink-50 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Latest opportunities</h2>
            <Link href="/jobs" className="text-sm font-medium text-primary-700 hover:underline">
              See all
            </Link>
          </div>

          {latestJobs.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {latestJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block rounded-md border border-ink-200 bg-white p-3 transition-colors hover:border-primary-400 hover:bg-primary-50"
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
