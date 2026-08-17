import { Badge } from "@/components/ui/Badge";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/format";
import type { JobSummary } from "@/lib/types";

/**
 * The badges that carry meaning in this marketplace: how fast, what kind of work,
 * and whether the opportunity is private.
 */
export function JobBadges({ job }: { job: JobSummary }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {job.immediateHire && <Badge tone="immediate">Immediate start</Badge>}
      {job.private && <Badge tone="brand">Private</Badge>}
      <Badge>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
      {job.remote && <Badge>Remote</Badge>}
      {job.freelance && <Badge>Freelance</Badge>}
      {job.internship && <Badge>Internship</Badge>}
      {job.sideIncome && <Badge>Side income</Badge>}
    </div>
  );
}
