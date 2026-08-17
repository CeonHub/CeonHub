import Link from "next/link";

/**
 * Wordmark. The glyph is two overlapping arcs — an employer and a candidate
 * meeting — drawn inline so the header needs no image request.
 */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="CeonHub home">
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <rect width="28" height="28" rx="7" className="fill-brand-700" />
        <path
          d="M19.5 10.4a6 6 0 1 0 0 7.2"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="19.4" cy="14" r="2.1" className="fill-immediate-600" />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-ink-900">CeonHub</span>
    </Link>
  );
}
