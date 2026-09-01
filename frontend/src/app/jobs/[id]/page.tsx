import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { JobBadges } from "@/components/jobs/JobBadges";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ApiError, apiFetch } from "@/lib/api";
import { formatCompensation, formatDate, formatLocation } from "@/lib/format";
import type { Job } from "@/lib/types";
import { JobApplyPanel } from "./JobApplyPanel";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Public job pages are server-rendered, so search engines see the real content. */
async function loadJob(id: string): Promise<Job | null> {
  try {
    const data = await apiFetch<{ job: Job }>(`/api/jobs/${id}`, { revalidate: 60 });
    return data.job;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await loadJob(id);

  if (!job) {
    return { title: "Job not found", robots: { index: false } };
  }

  const description = job.description.slice(0, 155).replace(/\s+/g, " ").trim();
  const title = `${job.title} at ${job.company.name}`;

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
    // Private opportunities must never be indexed, even if a link leaks.
    robots: job.private ? { index: false, follow: false } : undefined,
    openGraph: { type: "article", title, description, url: `/jobs/${job.id}` },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await loadJob(id);

  if (!job) notFound();

  const compensation = formatCompensation(job.compensation, job.currency);

  return (
    <Container className="py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <article>
          <nav aria-label="Breadcrumb" className="pb-4 text-sm text-ink-500">
            <Link href="/jobs" className="hover:text-primary-700">
              Jobs
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="text-ink-700">{job.title}</span>
          </nav>

          <header>
            <h1 className="text-3xl font-semibold text-ink-900">{job.title}</h1>
            <p className="mt-2 text-ink-600">
              <Link
                href={`/companies/${job.company.slug}`}
                className="font-medium text-primary-700 hover:underline"
              >
                {job.company.name}
              </Link>
              <span aria-hidden="true"> · </span>
              {formatLocation(job.location, job.remote)}
            </p>
            <div className="mt-4">
              <JobBadges job={job} />
            </div>
          </header>

          <section className="mt-8" aria-label="Job description">
            <h2 className="sr-only">Job description</h2>
            <div className="whitespace-pre-line text-[0.95rem] leading-7 text-ink-700">
              {job.description}
            </div>
          </section>

          {job.skills.length > 0 && (
            <section className="mt-8" aria-label="Skills">
              <h2 className="text-sm font-semibold text-ink-900">Skills</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <li key={skill.id}>
                    <Badge tone="primary">{skill.name}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside className="space-y-6">
          <JobApplyPanel jobId={job.id} jobTitle={job.title} jobStatus={job.status} />

          <Card>
            <CardHeader title="Job details" />
            <CardBody>
              <dl className="space-y-3 text-sm">
                <Detail label="Category" value={job.category} />
                <Detail label="Compensation" value={compensation ?? "Not specified"} />
                <Detail
                  label="Posted"
                  value={formatDate(job.publishedAt ?? job.createdAt)}
                />
                {job.expiresAt && <Detail label="Closes" value={formatDate(job.expiresAt)} />}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="About the company" />
            <CardBody className="text-sm text-ink-600">
              <p className="font-medium text-ink-900">{job.company.name}</p>
              {job.company.location && <p className="mt-1">{job.company.location}</p>}
              <Link
                href={`/companies/${job.company.slug}`}
                className="mt-3 inline-block font-medium text-primary-700 hover:underline"
              >
                View company profile
              </Link>
            </CardBody>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}
