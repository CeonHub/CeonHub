import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { APPLICATION_STATUS_LABELS } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/types";

const TONES: Record<ApplicationStatus, BadgeTone> = {
  SUBMITTED: "neutral",
  REVIEWING: "brand",
  SHORTLISTED: "brand",
  INTERVIEW: "immediate",
  OFFER: "immediate",
  HIRED: "available",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={TONES[status]}>{APPLICATION_STATUS_LABELS[status]}</Badge>;
}
