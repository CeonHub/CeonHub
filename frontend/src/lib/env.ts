/**
 * Frontend configuration. Only NEXT_PUBLIC_* variables exist here — the browser
 * bundle must never contain a secret, and the frontend never talks to the database.
 *
 * References to process.env are written out in full because Next.js inlines them
 * at build time by exact textual match.
 */
function required(value: string | undefined, name: string, fallback: string): string {
  if (value && value.trim()) return value.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    console.warn(`[config] ${name} is not set; falling back to ${fallback}`);
  }
  return fallback;
}

/** Base URL of the CeonHub REST API, without a trailing slash. */
export const API_URL = required(
  process.env.NEXT_PUBLIC_API_URL,
  "NEXT_PUBLIC_API_URL",
  "http://localhost:4000",
);

/** Absolute URL of this site, used for SEO metadata. */
export const SITE_URL = required(
  process.env.NEXT_PUBLIC_SITE_URL,
  "NEXT_PUBLIC_SITE_URL",
  "http://localhost:3000",
);
