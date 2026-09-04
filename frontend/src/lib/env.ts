/**
 * Frontend configuration. Only NEXT_PUBLIC_* variables exist here: the browser
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
  "https://ceonhub-api.onrender.com",
);

/** Absolute URL of this site, used for SEO metadata. */
export const SITE_URL = required(
  process.env.NEXT_PUBLIC_SITE_URL,
  "NEXT_PUBLIC_SITE_URL",
  "https://www.ceonhub.net",
);

/**
 * The email domain staff accounts must use. This is display only, since the API
 * is what enforces it, but it has to agree with the backend's ADMIN_EMAIL_DOMAIN,
 * or the sign-up form promises a domain the API then refuses.
 */
export const ADMIN_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN?.trim() || "ceonhub.net";

/**
 * The company whose jobs /careers shows: CeonHub's own. It is an ordinary company
 * row, created from the admin console, so the careers page is the public job list
 * filtered to one slug rather than a second job system.
 */
export const CAREERS_COMPANY_SLUG =
  process.env.NEXT_PUBLIC_CAREERS_COMPANY_SLUG?.trim() || "ceonhub";
