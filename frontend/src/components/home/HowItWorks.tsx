import { Container } from "@/components/layout/Container";

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
    <section className="py-16" aria-label="How CeonHub works">
      <Container>
        <h2 className="text-2xl font-semibold text-ink-900">How CeonHub works</h2>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
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
}: {
  title: string;
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="rounded-card border border-ink-200 bg-white p-6">
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
              {index + 1}
            </span>
            <div>
              <p className="font-medium text-ink-900">{step.title}</p>
              <p className="text-sm text-ink-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
