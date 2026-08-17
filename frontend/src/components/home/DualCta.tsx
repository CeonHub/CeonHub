import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export function DualCta() {
  return (
    <section className="pb-16" aria-label="Get started">
      <Container className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-ink-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-ink-900">Looking for work?</h2>
          <p className="mt-2 text-ink-600">
            Create a profile, set yourself as available now, and start applying today. Employers can
            also come to you directly.
          </p>
          <ButtonLink href="/register" className="mt-5">
            Create a candidate account
          </ButtonLink>
        </div>

        <div className="rounded-card border border-brand-200 bg-brand-50 p-8">
          <h2 className="text-xl font-semibold text-ink-900">Hiring?</h2>
          <p className="mt-2 text-ink-700">
            Post a role in minutes, review applicants in one place, and invite candidates privately
            when the job should not be advertised.
          </p>
          <ButtonLink href="/register?role=EMPLOYER" className="mt-5">
            Create an employer account
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
