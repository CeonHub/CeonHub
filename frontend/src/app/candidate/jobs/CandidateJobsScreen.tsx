"use client";

import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobCard } from "@/components/jobs/JobCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";
import type { CandidateProfile, JobSummary, Paginated } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";

export function CandidateJobsScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["CANDIDATE"]}>{() => <CandidateJobs />}</AuthGate>
    </Container>
  );
}

/**
 * Deliberately simple matching: the candidate's own skills, one at a time, plus
 * their desired employment type. No recommendation engine: the filter is visible
 * and the candidate stays in control of it.
 */
function CandidateJobs() {
  const profile = useApiQuery<{ candidate: CandidateProfile }>("/api/candidates/me");
  const skills = profile.data?.candidate.skills ?? [];
  const desired = profile.data?.candidate.desiredEmployment ?? null;

  const [skillSlug, setSkillSlug] = useState<string | null>(null);
  const activeSkill = skillSlug ?? skills[0]?.slug ?? null;

  const jobs = useApiQuery<Paginated<JobSummary>>(profile.data ? "/api/jobs" : null, {
    skill: activeSkill ?? undefined,
    employmentType: desired ?? undefined,
    pageSize: 20,
  });

  if (profile.loading) return <LoadingState label="Loading your profile…" />;
  if (profile.error) {
    return <ErrorState message={errorMessage(profile.error)} onRetry={profile.reload} />;
  }

  return (
    <>
      <PageHeader
        title="Jobs for you"
        description={
          skills.length > 0
            ? "Open roles matching the skills on your profile."
            : "Add skills to your profile and CeonHub will match jobs to them."
        }
        action={<ButtonLink href="/jobs">Search all jobs</ButtonLink>}
      />

      {skills.length === 0 ? (
        <EmptyState
          title="No skills on your profile yet"
          description="Skills are how employers find you and how jobs are matched to you here."
          action={<ButtonLink href="/candidate/profile">Add your skills</ButtonLink>}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 pb-4">
            <span className="text-sm text-ink-500">Matching on:</span>
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => setSkillSlug(skill.slug)}
                aria-pressed={activeSkill === skill.slug}
                className={
                  activeSkill === skill.slug
                    ? "rounded-full border border-brand-edge bg-brand px-3 py-1 text-sm font-medium text-brand-fg"
                    : "rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700 hover:bg-ink-200"
                }
              >
                {skill.name}
              </button>
            ))}
            {desired && <Badge tone="primary">{desired.replace("_", " ").toLowerCase()}</Badge>}
          </div>

          {jobs.loading ? (
            <LoadingState />
          ) : jobs.error ? (
            <ErrorState message={errorMessage(jobs.error)} onRetry={jobs.reload} />
          ) : jobs.data && jobs.data.items.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {jobs.data.items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches right now"
              description="Try another skill, or search all jobs with your own filters."
              action={<ButtonLink href="/jobs">Search all jobs</ButtonLink>}
            />
          )}
        </>
      )}
    </>
  );
}
