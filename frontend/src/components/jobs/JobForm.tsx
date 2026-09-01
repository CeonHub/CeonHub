"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkillsInput } from "@/components/ui/SkillsInput";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError, apiFetch, errorMessage } from "@/lib/api";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/format";
import type { EmploymentType, Job } from "@/lib/types";

interface JobFormValues {
  title: string;
  description: string;
  category: string;
  employmentType: EmploymentType;
  location: string;
  remote: boolean;
  compensation: string;
  currency: string;
  immediateHire: boolean;
  private: boolean;
  internship: boolean;
  freelance: boolean;
  sideIncome: boolean;
  expiresAt: string;
  skills: string[];
}

const FLAGS: Array<{ name: keyof JobFormValues; label: string; description: string }> = [
  {
    name: "immediateHire",
    label: "Immediate start",
    description: "Highlighted at the top of search results.",
  },
  { name: "remote", label: "Remote", description: "Can be done from anywhere." },
  { name: "freelance", label: "Freelance", description: "Project or contract work." },
  { name: "sideIncome", label: "Side income", description: "Suitable alongside another job." },
  { name: "internship", label: "Internship", description: "Early-career or student role." },
  {
    name: "private",
    label: "Private opportunity",
    description: "Hidden from public search — only invited candidates can see and apply.",
  },
];

function toValues(job?: Job): JobFormValues {
  return {
    title: job?.title ?? "",
    description: job?.description ?? "",
    category: job?.category ?? "",
    employmentType: job?.employmentType ?? "FULL_TIME",
    location: job?.location ?? "",
    remote: job?.remote ?? false,
    compensation: job?.compensation ?? "",
    currency: job?.currency ?? "",
    immediateHire: job?.immediateHire ?? false,
    private: job?.private ?? false,
    internship: job?.internship ?? false,
    freelance: job?.freelance ?? false,
    sideIncome: job?.sideIncome ?? false,
    expiresAt: job?.expiresAt ? job.expiresAt.slice(0, 10) : "",
    skills: job?.skills.map((skill) => skill.name) ?? [],
  };
}

interface JobFormProps {
  categories: string[];
  /** Omitted when creating a new job. */
  job?: Job;
}

export function JobForm({ categories, job }: JobFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<JobFormValues>(() => toValues(job));
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<"draft" | "publish" | null>(null);

  function update<K extends keyof JobFormValues>(field: K, value: JobFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function submit(intent: "draft" | "publish", event: FormEvent) {
    event.preventDefault();
    setPending(intent);
    setError(null);
    setSaved(false);

    const body = {
      ...values,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
      ...(job
        ? intent === "publish"
          ? { status: "PUBLISHED" as const }
          : {}
        : { status: intent === "publish" ? ("PUBLISHED" as const) : ("DRAFT" as const) }),
    };

    try {
      const result = await apiFetch<{ job: Job }>(job ? `/api/jobs/${job.id}` : "/api/jobs", {
        method: job ? "PATCH" : "POST",
        body,
      });

      if (job) {
        setSaved(true);
        router.refresh();
      } else {
        router.push(`/employer/jobs/${result.job.id}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(errorMessage(caught)));
    } finally {
      setPending(null);
    }
  }

  const fieldError = (field: string) =>
    error instanceof ApiError ? error.fieldError(field) : undefined;

  return (
    <form onSubmit={(event) => submit("draft", event)} className="space-y-6" noValidate>
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      {saved && <Alert tone="success">Job saved.</Alert>}

      <Card>
        <CardHeader title="The role" />
        <CardBody className="space-y-5">
          <Field htmlFor="title" label="Job title" error={fieldError("title")} required>
            <Input
              id="title"
              value={values.title}
              error={fieldError("title")}
              onChange={(event) => update("title", event.target.value)}
              placeholder="e.g. Warehouse assistant (evenings)"
              required
            />
          </Field>

          <Field
            htmlFor="description"
            label="Description"
            hint="What the work involves, what you expect, and how quickly you need someone."
            error={fieldError("description")}
            required
          >
            <Textarea
              id="description"
              rows={12}
              hint
              value={values.description}
              error={fieldError("description")}
              onChange={(event) => update("description", event.target.value)}
              required
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field htmlFor="category" label="Category" error={fieldError("category")} required>
              <Select
                id="category"
                placeholder="Choose a category"
                options={categories.map((category) => ({ value: category, label: category }))}
                value={values.category}
                error={fieldError("category")}
                onChange={(event) => update("category", event.target.value)}
                required
              />
            </Field>

            <Field htmlFor="employmentType" label="Employment type" required>
              <Select
                id="employmentType"
                options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={values.employmentType}
                onChange={(event) =>
                  update("employmentType", event.target.value as EmploymentType)
                }
              />
            </Field>
          </div>

          <Field htmlFor="skills" label="Skills" error={fieldError("skills")}>
            <SkillsInput
              id="skills"
              value={values.skills}
              onChange={(skills) => update("skills", skills)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Location and pay" />
        <CardBody className="space-y-5">
          <Field htmlFor="location" label="Location" error={fieldError("location")}>
            <Input
              id="location"
              value={values.location}
              error={fieldError("location")}
              onChange={(event) => update("location", event.target.value)}
              placeholder="City, country"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              htmlFor="compensation"
              label="Compensation"
              hint="Free text, e.g. “$95–115k” or “$22/hour”."
              error={fieldError("compensation")}
            >
              <Input
                id="compensation"
                hint
                value={values.compensation}
                error={fieldError("compensation")}
                onChange={(event) => update("compensation", event.target.value)}
              />
            </Field>

            <Field htmlFor="currency" label="Currency" error={fieldError("currency")}>
              <Input
                id="currency"
                value={values.currency}
                error={fieldError("currency")}
                onChange={(event) => update("currency", event.target.value)}
                placeholder="USD"
                maxLength={8}
              />
            </Field>
          </div>

          <Field
            htmlFor="expiresAt"
            label="Closing date"
            hint="Optional. The job stops appearing in search after this date."
            error={fieldError("expiresAt")}
          >
            <Input
              id="expiresAt"
              type="date"
              hint
              value={values.expiresAt}
              error={fieldError("expiresAt")}
              onChange={(event) => update("expiresAt", event.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Opportunity type" description="These drive the CeonHub filters." />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {FLAGS.map((flag) => (
            <label
              key={flag.name}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-ink-200 p-3 hover:bg-ink-50"
            >
              <input
                type="checkbox"
                checked={Boolean(values[flag.name])}
                onChange={(event) => update(flag.name, event.target.checked as never)}
                className="mt-1 h-4 w-4 rounded border-ink-300"
              />
              <span>
                <span className="block text-sm font-medium text-ink-900">{flag.label}</span>
                <span className="block text-sm text-ink-500">{flag.description}</span>
              </span>
            </label>
          ))}
        </CardBody>
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="submit"
          variant="secondary"
          loading={pending === "draft"}
          disabled={pending !== null}
        >
          {job ? "Save changes" : "Save as draft"}
        </Button>
        <Button
          type="button"
          loading={pending === "publish"}
          disabled={pending !== null}
          onClick={(event) => submit("publish", event)}
        >
          {job?.status === "PUBLISHED" ? "Save and keep published" : "Publish job"}
        </Button>
      </div>
    </form>
  );
}
