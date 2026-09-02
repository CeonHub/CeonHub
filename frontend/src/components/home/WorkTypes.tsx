import Link from "next/link";
import { Container } from "@/components/layout/Container";

export interface WorkType {
  href: string;
  title: string;
  description: string;
  count: number | null;
}

/**
 * The four ways of working the MVP is built around. Counts come from the live job
 * index, so an empty category is visibly empty rather than quietly implied.
 */
export function WorkTypes({ types }: { types: WorkType[] }) {
  return (
    <section className="bg-ink-50 py-20 lg:py-24" aria-label="Ways to work on CeonHub">
      <Container>
        <h2 className="text-section text-ink-950">Work the way you need to</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-700">
          Every job on CeonHub is tagged with how it actually works, so you can filter for the kind
          of opportunity you are after instead of reading through job descriptions.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((type) => (
            <Link
              key={type.href}
              href={type.href}
              className="group flex flex-col rounded-card bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-bold text-secondary-600">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-logo-green" />
                  {type.count === null ? "—" : type.count} open
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-950 transition-colors group-hover:bg-brand"
                >
                  <ArrowUpRightIcon className="h-4 w-4" />
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold tracking-tight text-ink-950">{type.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{type.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
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
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}
