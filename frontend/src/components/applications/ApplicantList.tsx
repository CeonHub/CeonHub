"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/States";
import { apiFetch, errorMessage } from "@/lib/api";
import { APPLICATION_STATUS_LABELS, formatRelative } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

/** Statuses an employer can set — withdrawing is the candidate's decision. */
const EMPLOYER_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
];

interface ApplicantListProps {
  applications: Application[];
  /** Called after a status change so the caller can refresh its data. */
  onChanged: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showJob?: boolean;
}

export function ApplicantList({
  applications,
  onChanged,
  emptyTitle = "No applications yet",
  emptyDescription = "Applications appear here as soon as candidates apply.",
  showJob = false,
}: ApplicantListProps) {
  if (applications.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card>
      <ul className="divide-y divide-ink-100">
        {applications.map((application) => (
          <ApplicantRow
            key={application.id}
            application={application}
            onChanged={onChanged}
            showJob={showJob}
          />
        ))}
      </ul>
    </Card>
  );
}

function ApplicantRow({
  application,
  onChanged,
  showJob,
}: {
  application: Application;
  onChanged: () => void;
  showJob: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const candidate = application.candidate;

  async function changeStatus(status: ApplicationStatus) {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/applications/${application.id}`, { method: "PATCH", body: { status } });
      onChanged();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  const withdrawn = application.status === "WITHDRAWN";

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink-900">
            {candidate ? candidate.name : "Candidate"}
            {showJob && (
              <>
                <span className="text-ink-400"> — </span>
                <Link
                  href={`/jobs/${application.job.id}`}
                  className="font-normal text-brand-700 hover:underline"
                >
                  {application.job.title}
                </Link>
              </>
            )}
          </p>
          {candidate?.headline && <p className="text-sm text-ink-600">{candidate.headline}</p>}
          <p className="mt-0.5 text-sm text-ink-500">
            Applied {formatRelative(application.createdAt)}
            {candidate?.location ? ` · ${candidate.location}` : ""}
          </p>

          {candidate && candidate.skills.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {candidate.skills.slice(0, 8).map((skill) => (
                <li key={skill.id}>
                  <Badge>{skill.name}</Badge>
                </li>
              ))}
            </ul>
          )}

          {application.coverLetter && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-brand-700">
                Read message
              </summary>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-700">
                {application.coverLetter}
              </p>
            </details>
          )}

          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {candidate?.resumeUrl && (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-700 hover:underline"
              >
                View resume
              </a>
            )}
            {candidate?.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="font-medium text-brand-700 hover:underline"
              >
                {candidate.email}
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {withdrawn ? (
            <ApplicationStatusBadge status={application.status} />
          ) : (
            <Select
              id={`status-${application.id}`}
              aria-label="Application status"
              className="w-44"
              disabled={saving}
              value={application.status}
              options={EMPLOYER_STATUSES.map((status) => ({
                value: status,
                label: APPLICATION_STATUS_LABELS[status],
              }))}
              onChange={(event) => changeStatus(event.target.value as ApplicationStatus)}
            />
          )}
          {error && <p className="text-sm text-danger-600">{error}</p>}
        </div>
      </div>
    </li>
  );
}
