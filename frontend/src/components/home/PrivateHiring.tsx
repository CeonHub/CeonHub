import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

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
    <section className="bg-night py-20 text-white lg:py-28" aria-label="Private hiring">
      <Container className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <Eyebrow tone="dark">Private opportunities</Eyebrow>

          <h2 className="text-section mt-6 text-white">Some roles should not be advertised</h2>

          <p className="mt-6 max-w-xl leading-relaxed text-ink-400">
            Replacement hires, confidential projects, or a role you only want to offer to three
            people. Mark a job private and it stays out of public search and out of search engines —
            only the candidates you invite can see or apply to it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register?role=EMPLOYER" size="lg">
              Start hiring privately
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="inverse" size="lg">
              How it works
            </ButtonLink>
          </div>
        </div>

        <ol className="space-y-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-card bg-night-raised p-6">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold tracking-tight text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
