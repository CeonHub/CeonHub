"use client";

import { Container } from "@/components/layout/Container";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Last line of defence: whatever fails, the user gets a real page with a way out
 * instead of a blank screen.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <Container className="max-w-xl py-24 text-center">
        <h1 className="text-3xl font-semibold text-ink-900">Something went wrong</h1>
        <p className="mt-3 text-ink-600">
          The page could not be loaded. This is usually temporary — trying again often works. If it
          keeps happening, the API may be unreachable.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <ButtonLink href="/" variant="secondary">
            Go home
          </ButtonLink>
        </div>
      </Container>
    </main>
  );
}
