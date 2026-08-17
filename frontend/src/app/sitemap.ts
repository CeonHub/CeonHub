import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api";
import { SITE_URL } from "@/lib/env";
import type { Company, JobSummary, Paginated } from "@/lib/types";

/** Rebuilt hourly; the job index only ever contains public, published jobs. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/companies`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const [jobs, companies] = await Promise.all([
    apiFetch<Paginated<JobSummary>>("/api/jobs", { query: { pageSize: 50 }, revalidate: 3600 })
      .then((result) => result.items)
      .catch(() => [] as JobSummary[]),
    apiFetch<Paginated<Company>>("/api/companies", { query: { pageSize: 50 }, revalidate: 3600 })
      .then((result) => result.items)
      .catch(() => [] as Company[]),
  ]);

  return [
    ...staticRoutes,
    ...jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${job.id}`,
      lastModified: new Date(job.publishedAt ?? job.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...companies.map((company) => ({
      url: `${SITE_URL}/companies/${company.slug}`,
      lastModified: new Date(company.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
