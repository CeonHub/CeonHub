import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    title: "Search the candidate directory",
    body: "Filter by skill, availability and country. Only candidates who chose to be public appear.",
  },
  {
    title: "Invite privately",
    body: "Pick one of your jobs, write a short message and send it. The candidate sees it in their dashboard.",
  },
  {
    title: "They accept or decline",
    body: "Accepting files their application, so the conversation continues where the rest of your hiring lives.",
  },
];

/** The differentiator, explained concretely rather than as a slogan. */
export function PrivateHiring() {
  return (
    <section className="border-y border-ink-200 bg-ink-900 py-16 text-white" aria-label="Private hiring">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand-200 uppercase">
            Private opportunities
          </p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Some roles should not be advertised
          </h2>
          <p className="mt-4 text-ink-300">
            Replacement hires, confidential projects, or a role you only want to offer to three
            people. Mark a job private and it stays out of public search and out of search engines —
            only the candidates you invite can see or apply to it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/register?role=EMPLOYER">Start hiring privately</ButtonLink>
            <ButtonLink
              href="/how-it-works"
              variant="secondary"
              className="border-ink-700 bg-transparent text-white hover:bg-ink-800"
            >
              How it works
            </ButtonLink>
          </div>
        </div>

        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-card bg-ink-800 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-ink-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
