/**
 * Job categories are a fixed list validated by Zod rather than a database enum, so
 * adding one is a code change instead of a migration. The frontend reads the same
 * list from GET /api/jobs/meta.
 */
export const JOB_CATEGORIES = [
  "Engineering",
  "Design",
  "Product",
  "Data & Analytics",
  "Marketing",
  "Sales",
  "Customer Support",
  "Operations",
  "Finance & Accounting",
  "People & Recruiting",
  "Writing & Content",
  "Education & Training",
  "Healthcare",
  "Legal",
  "Hospitality & Events",
  "Retail",
  "Logistics & Delivery",
  "Construction & Trades",
  "Admin & Assistance",
  "Other",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
