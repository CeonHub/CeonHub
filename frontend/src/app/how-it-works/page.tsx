import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CANDIDATE_STEPS, EMPLOYER_STEPS, StepColumn } from "@/components/home/HowItWorks";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "How CeonHub works",
  description:
    "How hiring works on CeonHub for candidates and employers, including private opportunities that never appear in public search.",
  alternates: { canonical: "/how-it-works" },
};

const FAQ = [
  {
    question: "What is a private opportunity?",
    answer:
      "A job an employer marks as private. It is excluded from public search, from company pages and from search engine indexing. Only candidates who receive an invitation can open it or apply to it.",
  },
  {
    question: "Who can see my candidate profile?",
    answer:
      "You choose. A public profile can be found by employers searching the candidate directory. A private profile is hidden from that directory and is only visible to employers whose jobs you have applied to. Your email address is never shown in the directory.",
  },
  {
    question: "What does accepting an invitation do?",
    answer:
      "Accepting files an application to that job, so you appear in the employer's applicant list and can follow the status like any other application. Declining does nothing else: the employer simply sees your answer.",
  },
  {
    question: "Does it cost anything?",
    answer:
      "No. This early version of CeonHub has no payments, subscriptions or fees of any kind for either side.",
  },
  {
    question: "How do I stop receiving applications for a job?",
    answer:
      "Pause it to take it out of search temporarily, or close it when the role is filled. Jobs that already have applications cannot be deleted, so nobody loses their history.",
  },
];

export default function HowItWorksPage() {
  return (
    <main>
      <Container className="py-16">
        <div className="max-w-3xl">
          <h1 className="text-section text-ink-950">How CeonHub works</h1>
          <p className="mt-4 text-lg text-ink-600">
            Two sides, one loop: employers post and invite, candidates search and apply. Here is what
            each side actually does.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <StepColumn
            title="For candidates"
            steps={CANDIDATE_STEPS}
            className="border border-ink-200 bg-white"
          />
          <StepColumn
            title="For employers"
            steps={EMPLOYER_STEPS}
            className="border border-ink-200 bg-white"
          />
        </div>

        <section className="mt-12 max-w-3xl" aria-label="Common questions">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">Common questions</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((entry) => (
              <Card key={entry.question}>
                <CardHeader title={entry.question} />
                <CardBody className="text-ink-700">{entry.answer}</CardBody>
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/register">Create a candidate account</ButtonLink>
          <ButtonLink href="/register?role=EMPLOYER" variant="secondary">
            Create an employer account
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
