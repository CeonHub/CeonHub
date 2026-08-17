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
    <section className="py-16" aria-label="Ways to work on CeonHub">
      <Container>
        <h2 className="text-2xl font-semibold text-ink-900">Work the way you need to</h2>
        <p className="mt-2 max-w-2xl text-ink-600">
          Every job on CeonHub is tagged with how it actually works, so you can filter for the kind
          of opportunity you are after instead of reading through job descriptions.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {types.map((type) => (
            <Link
              key={type.href}
              href={type.href}
              className="rounded-card border border-ink-200 bg-white p-5 transition-colors hover:border-brand-300"
            >
              <p className="text-sm font-semibold text-brand-700">
                {type.count === null ? "—" : type.count} open
              </p>
              <h3 className="mt-1 font-semibold text-ink-900">{type.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{type.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
