import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCompensation, formatLocation, formatRelative } from "@/lib/format";
import type { JobSummary } from "@/lib/types";
import { JobBadges } from "./JobBadges";

export function JobCard({ job }: { job: JobSummary }) {
  const compensation = formatCompensation(job.compensation, job.currency);

  return (
    <article className="relative rounded-card border border-ink-200 bg-white p-5 transition-colors hover:border-primary-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink-900">
            <Link href={`/jobs/${job.id}`} className="hover:text-primary-700">
              {/* Stretch the link across the card for easier tapping on mobile. */}
              <span className="absolute inset-0 sm:hidden" aria-hidden="true" />
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-600">
            {job.company.name} · {formatLocation(job.location, job.remote)}
          </p>
        </div>
        {compensation && (
          <span className="shrink-0 text-sm font-medium text-ink-800">{compensation}</span>
        )}
      </div>

      <div className="mt-3">
        <JobBadges job={job} />
      </div>

      {job.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((skill) => (
            <li key={skill.id}>
              <Badge tone="neutral">{skill.name}</Badge>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-ink-500">
        {job.category} · posted {formatRelative(job.publishedAt ?? job.createdAt)}
      </p>
    </article>
  );
}
