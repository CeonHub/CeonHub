import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { JOB_STATUS_LABELS } from "@/lib/format";
import type { JobStatus } from "@/lib/types";

const TONES: Record<JobStatus, BadgeTone> = {
  PUBLISHED: "available",
  DRAFT: "neutral",
  PAUSED: "immediate",
  CLOSED: "neutral",
  HIDDEN: "danger",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={TONES[status]}>{JOB_STATUS_LABELS[status]}</Badge>;
}
