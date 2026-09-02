import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main>
      <Container className="max-w-xl py-24 text-center">
        <p className="text-sm font-semibold text-primary-700">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950">We could not find that page</h1>
        <p className="mt-3 text-ink-600">
          The link may be out of date, or the job may have been closed or made private.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/jobs">Browse jobs</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
