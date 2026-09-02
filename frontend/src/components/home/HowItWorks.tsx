import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/cn";

export const CANDIDATE_STEPS = [
  { title: "Create your profile", body: "Name, skills, availability and a resume. Two minutes." },
  { title: "Search or get matched", body: "Filter by immediate start, freelance, side income or internship." },
  { title: "Apply in one click", body: "Your profile and resume go with every application." },
  { title: "Track everything", body: "Application status and private invitations in one dashboard." },
];

export const EMPLOYER_STEPS = [
  { title: "Set up your company", body: "One profile, used on every job you publish." },
  { title: "Post a job", body: "Publish immediately, or save a draft until you are ready." },
  { title: "Review applicants", body: "Move people through the stages: reviewing, interview, offer, hired." },
  { title: "Invite privately", body: "Approach candidates directly for roles you never advertise." },
];

export function HowItWorks() {
  return (
    <section className="bg-white py-20 lg:py-24" aria-label="How CeonHub works">
      <Container>
        <h2 className="text-section text-ink-950">How CeonHub works</h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <StepColumn title="For candidates" steps={CANDIDATE_STEPS} />
          <StepColumn title="For employers" steps={EMPLOYER_STEPS} />
        </div>
      </Container>
    </section>
  );
}

export function StepColumn({
  title,
  steps,
  className,
}: {
  title: string;
  steps: Array<{ title: string; body: string }>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-panel bg-ink-50 p-8", className)}>
      <h3 className="text-lg font-bold tracking-tight text-ink-950">{title}</h3>

      {/* The numeral is a hanging figure rather than a chip: at this density a row
          of filled circles turns the column into a checklist, and these are
          stages, not tasks. The body text lines up under the title, not the
          number, so the left edge of the prose stays straight. */}
      <ol className="mt-6 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title}>
            <div className="flex items-baseline gap-2.5">
              <span aria-hidden="true" className="text-lg font-extrabold text-primary-600">
                {index + 1}
              </span>
              <p className="font-bold tracking-tight text-ink-950">{step.title}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
