import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About CeonHub",
  description:
    "CeonHub is a hiring and work marketplace focused on speed: immediate hiring, freelance and side income work, internships and private employer–candidate connections.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <Container className="max-w-3xl py-16">
        <h1 className="text-3xl font-semibold text-ink-900">About CeonHub</h1>

        <div className="mt-6 space-y-5 text-[1.05rem] leading-8 text-ink-700">
          <p>
            Most hiring tools are built around long processes: months-long searches, layers of
            screening, and roles that are advertised the same way whether the employer needs someone
            next quarter or next week.
          </p>
          <p>
            CeonHub is built for the other case. It connects employers who need people quickly with
            candidates who want work quickly — immediate starts, freelance projects, side income and
            internships, alongside conventional full-time roles.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-ink-900">What makes it different</h2>
          <p>
            <strong className="font-semibold text-ink-900">Speed is a first-class filter.</strong>{" "}
            Employers mark a job as an immediate start, and candidates mark themselves as available
            now. Both sides can search on it, so urgency is visible instead of implied.
          </p>
          <p>
            <strong className="font-semibold text-ink-900">Private hiring is built in.</strong> Not
            every role should be advertised. A private job never enters public search and is not
            indexed by search engines; only the candidates an employer invites can see or apply to
            it.
          </p>
          <p>
            <strong className="font-semibold text-ink-900">
              Employers and candidates talk directly.
            </strong>{" "}
            There is no agency in the middle. An employer finds a candidate, sends an invitation, and
            the candidate answers it themselves.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-ink-900">Where it is going</h2>
          <p>
            This is an early version, deliberately small. The focus is on making the core loop work
            reliably: post a job, find it, apply, review, hire — plus private invitations. Payments,
            messaging, referrals and recruiting services are possible later, but nothing is built
            until the basics are solid.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/jobs">Find jobs</ButtonLink>
          <ButtonLink href="/register?role=EMPLOYER" variant="secondary">
            Hire talent
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
