import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

/**
 * The two doors, given equal weight. Only the buttons differ in rank: a filled
 * one for the candidate side, an outlined one for the employer side. Two filled
 * brand buttons side by side would make the reader pick a colour rather than a
 * role.
 */
export function DualCta() {
  return (
    <section className="bg-white pb-16 lg:pb-20" aria-label="Get started">
      <Container className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-panel bg-ink-50 p-8 lg:p-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">Looking for work?</h2>
          <p className="mt-3 max-w-md leading-relaxed text-ink-700">
            Create a profile, set yourself as available now, and start applying today. Employers can
            also come to you directly.
          </p>
          <ButtonLink href="/register" size="lg" className="mt-7">
            Create a candidate account
          </ButtonLink>
        </div>

        <div className="rounded-panel bg-ink-50 p-8 lg:p-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-ink-950">Hiring?</h2>
          <p className="mt-3 max-w-md leading-relaxed text-ink-700">
            Post a role in minutes, review applicants in one place, and invite candidates privately
            when the job should not be advertised.
          </p>
          <ButtonLink href="/register?role=EMPLOYER" variant="secondary" size="lg" className="mt-7">
            Create an employer account
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
