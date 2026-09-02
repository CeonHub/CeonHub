import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatLocation, formatRelative } from "@/lib/format";
import type { JobSummary } from "@/lib/types";

/**
 * The hero doubles as the entry point to search: a real keyword field that lands on
 * /jobs, next to a live panel of the newest roles rather than a stock illustration.
 */
export function HomeHero({ latestJobs }: { latestJobs: JobSummary[] }) {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Two very faint brand washes bled in from the corners. At 5% they read as
          a warm cast on the white rather than as colour, which is the point —
          the hero already has a green headline and an orange button in it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(55rem 28rem at 5% -20%, var(--logo-green), transparent 62%), " +
            "radial-gradient(45rem 26rem at 95% 0%, var(--logo-orange), transparent 62%)",
        }}
      />

      <Container className="relative grid items-center gap-14 py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-24">
        <div>
          <Eyebrow>Hiring and work marketplace</Eyebrow>

          <h1 className="text-display mt-6 text-ink-950">
            Find work.
            <br />
            Hire talent.
            <br />
            <span className="text-logo-green">Connect privately.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-700">
            CeonHub is built for speed: immediate starts, freelance projects, side income and
            internships across the US — plus private opportunities that never appear in public
            search.
          </p>

          {/* The field and its button share one rounded shell, so the pair reads
              as a single control instead of an input that happens to sit beside
              a button. `focus-within` moves the ring to the shell to match. */}
          <form
            action="/jobs"
            method="get"
            className="mt-9 flex max-w-2xl items-center gap-2 rounded-panel border border-ink-200 bg-ink-50 p-2 pl-4 shadow-card transition-colors focus-within:border-ink-300 focus-within:bg-white"
          >
            <label htmlFor="hero-q" className="sr-only">
              What work are you looking for?
            </label>
            <SearchIcon className="hidden h-5 w-5 shrink-0 text-ink-500 sm:block" />
            <input
              id="hero-q"
              name="q"
              type="text"
              placeholder="Job title, skill or company"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[0.9375rem] text-ink-950 outline-none placeholder:text-ink-500"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-brand px-5 text-sm font-semibold whitespace-nowrap text-brand-fg shadow-control ring-1 ring-brand-edge transition-colors ring-inset hover:bg-brand-hover active:bg-brand-active"
            >
              <span className="hidden sm:inline">Search jobs</span>
              <span className="sm:hidden">Search</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/jobs" variant="secondary" size="lg">
              Find Jobs
            </ButtonLink>
            <ButtonLink href="/register?role=EMPLOYER" variant="secondary" size="lg">
              Hire Talent
            </ButtonLink>
          </div>
        </div>

        <aside className="rounded-panel border border-ink-200 bg-ink-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-bold tracking-tight text-ink-950">Latest opportunities</h2>
            <Link
              href="/jobs"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              See all
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {latestJobs.length > 0 ? (
            <ul className="mt-5 space-y-2.5">
              {latestJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block rounded-card border border-ink-200 bg-white p-4 transition-all hover:border-ink-300 hover:shadow-card"
                  >
                    <p className="flex items-start gap-2 font-semibold text-ink-950">
                      <span className="min-w-0 flex-1 truncate">{job.title}</span>
                      {job.immediateHire && (
                        <span className="shrink-0 rounded-full bg-immediate-50 px-2 py-0.5 text-xs font-semibold text-immediate-700 ring-1 ring-immediate-600/20 ring-inset">
                          Immediate
                        </span>
                      )}
                    </p>
                    <p className="mt-1 truncate text-sm text-ink-600">
                      {job.company.name} · {formatLocation(job.location, job.remote)} ·{" "}
                      {formatRelative(job.publishedAt ?? job.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-card border border-ink-200 bg-white px-6 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-600">
                <BriefcaseIcon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-bold text-ink-950">No jobs published yet</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-600">
                If you are running this locally, seed the demo data with{" "}
                <code className="font-mono text-[0.8125rem] text-primary-600">npm run db:seed</code>.
              </p>
            </div>
          )}
        </aside>
      </Container>
    </section>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M2.5 12.5h19" />
    </svg>
  );
}
