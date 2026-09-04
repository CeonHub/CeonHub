"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { apiFetch, errorMessage } from "@/lib/api";
import type { CandidateSummary, JobSummary, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

/**
 * The private hiring flow: pick one of your own jobs, add a message, send.
 * Private jobs are the point of this: they never appear in public search.
 */
export function InviteCandidateModal({
  candidate,
  onClose,
}: {
  candidate: CandidateSummary | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={candidate !== null}
      onClose={onClose}
      title={candidate ? `Invite ${candidate.name}` : "Invite candidate"}
      description="They will see this in their private invitations."
    >
      {candidate && <InviteForm key={candidate.userId} candidate={candidate} onClose={onClose} />}
    </Modal>
  );
}

function InviteForm({ candidate, onClose }: { candidate: CandidateSummary; onClose: () => void }) {
  const jobs = useApiQuery<Paginated<JobSummary>>("/api/jobs/mine", { pageSize: 50 });
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const invitableJobs = (jobs.data?.items ?? []).filter(
    (job) => job.status === "PUBLISHED" || job.status === "DRAFT" || job.status === "PAUSED",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      await apiFetch("/api/invitations", {
        method: "POST",
        body: { jobId, candidateId: candidate.userId, message },
      });
      setSent(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert tone="success">
          Invitation sent to {candidate.name}. You will see their answer under Invitations.
        </Alert>
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && <Alert tone="error">{error}</Alert>}

      {jobs.loading ? (
        <p className="text-sm text-ink-500">Loading your jobs…</p>
      ) : invitableJobs.length === 0 ? (
        <Alert tone="info">
          You have no jobs to invite to yet. Create a job first, then tick “Private opportunity”
          to keep it out of public search.
        </Alert>
      ) : (
        <>
          <Field htmlFor="jobId" label="Opportunity" required>
            <Select
              id="jobId"
              placeholder="Choose a job"
              value={jobId}
              required
              options={invitableJobs.map((job) => ({
                value: job.id,
                label: job.private ? `${job.title} (private)` : job.title,
              }))}
              onChange={(event) => setJobId(event.target.value)}
            />
          </Field>

          <Field htmlFor="message" label="Message" hint="Tell them why you are reaching out.">
            <Textarea
              id="message"
              rows={4}
              hint
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="We are hiring for a role that matches your experience…"
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={sending} disabled={!jobId}>
              Send invitation
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
