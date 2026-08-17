import Link from "next/link";
import type { Company } from "@/lib/types";
import { CompanyLogo } from "./CompanyLogo";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="rounded-card border border-ink-200 bg-white p-5 transition-colors hover:border-brand-200">
      <div className="flex items-start gap-4">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl ?? null} />

        <div className="min-w-0">
          <h3 className="font-semibold text-ink-900">
            <Link href={`/companies/${company.slug}`} className="hover:text-brand-700">
              {company.name}
            </Link>
          </h3>
          {company.location && <p className="text-sm text-ink-500">{company.location}</p>}
          {company.description && (
            <p className="mt-2 line-clamp-2 text-sm text-ink-600">{company.description}</p>
          )}
          {company.openJobCount !== undefined && (
            <p className="mt-2 text-sm font-medium text-brand-700">
              {company.openJobCount} open {company.openJobCount === 1 ? "role" : "roles"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
