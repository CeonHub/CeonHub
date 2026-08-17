import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

/**
 * Dashboards and account pages are not useful to search engines, and private jobs
 * additionally carry noindex on the page itself.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/candidate/", "/employer/", "/admin", "/admin/", "/login", "/register"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
