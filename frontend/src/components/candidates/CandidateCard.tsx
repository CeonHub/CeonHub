import { Badge } from "@/components/ui/Badge";
import { AVAILABILITY_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/lib/format";
import type { CandidateSummary } from "@/lib/types";
import type { ReactNode } from "react";

export function CandidateCard({
  candidate,
  action,
}: {
  candidate: CandidateSummary;
  action?: ReactNode;
}) {
  return (
    <article className="rounded-card border border-ink-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-ink-950">{candidate.name}</h3>
          {candidate.headline && <p className="text-sm text-ink-600">{candidate.headline}</p>}
          <p className="mt-0.5 text-sm text-ink-500">
            {[candidate.location, candidate.country].filter(Boolean).join(", ") ||
              "Location not specified"}
          </p>
        </div>
        {action}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={candidate.availability === "AVAILABLE_NOW" ? "available" : "neutral"}>
          {AVAILABILITY_LABELS[candidate.availability]}
        </Badge>
        {candidate.desiredEmployment && (
          <Badge>{EMPLOYMENT_TYPE_LABELS[candidate.desiredEmployment]}</Badge>
        )}
      </div>

      {candidate.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {candidate.skills.slice(0, 8).map((skill) => (
            <li key={skill.id}>
              <Badge tone="primary">{skill.name}</Badge>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
