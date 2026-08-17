import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { INVITATION_STATUS_LABELS } from "@/lib/format";
import type { InvitationStatus } from "@/lib/types";

const TONES: Record<InvitationStatus, BadgeTone> = {
  PENDING: "immediate",
  ACCEPTED: "available",
  DECLINED: "neutral",
  EXPIRED: "neutral",
};

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  return <Badge tone={TONES[status]}>{INVITATION_STATUS_LABELS[status]}</Badge>;
}
