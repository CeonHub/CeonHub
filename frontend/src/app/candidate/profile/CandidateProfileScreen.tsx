"use client";

import { useState, type FormEvent } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SkillsInput } from "@/components/ui/SkillsInput";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError, apiFetch, errorMessage } from "@/lib/api";
import { AVAILABILITY_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/lib/format";
import type { Availability, CandidateProfile, EmploymentType } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useAuth } from "@/providers/AuthProvider";
import { ResumeUpload } from "./ResumeUpload";

const AVAILABILITY_OPTIONS = Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface FormState {
  name: string;
  headline: string;
  bio: string;
  location: string;
  country: string;
  availability: Availability;
  desiredEmployment: EmploymentType | "";
  portfolioUrl: string;
  profileVisibility: "PUBLIC" | "PRIVATE";
  skills: string[];
}

function toFormState(profile: CandidateProfile): FormState {
  return {
    name: profile.name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    country: profile.country ?? "",
    availability: profile.availability,
    desiredEmployment: profile.desiredEmployment ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
    profileVisibility: profile.profileVisibility,
    skills: profile.skills.map((skill) => skill.name),
  };
}

export function CandidateProfileScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["CANDIDATE"]}>{() => <CandidateProfileForm />}</AuthGate>
    </Container>
  );
}

function CandidateProfileForm() {
  const query = useApiQuery<{ candidate: CandidateProfile }>("/api/candidates/me");
  const profile = query.data?.candidate ?? null;

  if (query.error) return <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />;
  if (query.loading || !profile) return <LoadingState label="Loading your profile…" />;

  // The key re-mounts the form when the saved profile changes, so the form state is
  // initialised from props instead of being synchronised by an effect.
  return <ProfileFields key={profile.updatedAt} profile={profile} onSaved={query.reload} />;
}

function ProfileFields({
  profile,
  onSaved,
}: {
  profile: CandidateProfile;
  onSaved: () => void;
}) {
  const { refresh } = useAuth();
  const [form, setForm] = useState<FormState>(() => toFormState(profile));
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await apiFetch<{ candidate: CandidateProfile }>("/api/candidates/me", {
        method: "PATCH",
        body: {
          ...form,
          desiredEmployment: form.desiredEmployment === "" ? null : form.desiredEmployment,
        },
      });
      await refresh();
      setSaved(true);
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(errorMessage(caught)));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (field: string) =>
    error instanceof ApiError ? error.fieldError(field) : undefined;

  return (
    <>
      <PageHeader
        title="Your profile"
        description="Employers see this when they search for candidates and review your applications."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2" noValidate>
          {error && <Alert tone="error">{errorMessage(error)}</Alert>}
          {saved && <Alert tone="success">Profile saved.</Alert>}

          <Card>
            <CardHeader title="About you" />
            <CardBody className="space-y-5">
              <Field htmlFor="name" label="Full name" error={fieldError("name")} required>
                <Input
                  id="name"
                  value={form.name}
                  error={fieldError("name")}
                  onChange={(event) => update("name", event.target.value)}
                  required
                />
              </Field>

              <Field
                htmlFor="headline"
                label="Headline"
                hint="One line that sums you up, e.g. “Frontend developer, React & TypeScript”."
                error={fieldError("headline")}
              >
                <Input
                  id="headline"
                  value={form.headline}
                  hint
                  error={fieldError("headline")}
                  onChange={(event) => update("headline", event.target.value)}
                  maxLength={140}
                />
              </Field>

              <Field htmlFor="bio" label="About" error={fieldError("bio")}>
                <Textarea
                  id="bio"
                  value={form.bio}
                  error={fieldError("bio")}
                  onChange={(event) => update("bio", event.target.value)}
                  maxLength={4000}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field htmlFor="location" label="Location" error={fieldError("location")}>
                  <Input
                    id="location"
                    value={form.location}
                    error={fieldError("location")}
                    onChange={(event) => update("location", event.target.value)}
                  />
                </Field>
                <Field
                  htmlFor="country"
                  label="Country"
                  hint="Helps employers hiring internationally find you."
                  error={fieldError("country")}
                >
                  <Input
                    id="country"
                    value={form.country}
                    hint
                    error={fieldError("country")}
                    onChange={(event) => update("country", event.target.value)}
                  />
                </Field>
              </div>

              <Field htmlFor="portfolioUrl" label="Portfolio URL" error={fieldError("portfolioUrl")}>
                <Input
                  id="portfolioUrl"
                  type="url"
                  placeholder="https://"
                  value={form.portfolioUrl}
                  error={fieldError("portfolioUrl")}
                  onChange={(event) => update("portfolioUrl", event.target.value)}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Skills" description="Up to 20. Employers filter candidates by these." />
            <CardBody>
              <Field htmlFor="skills" label="Skills" error={fieldError("skills")}>
                <SkillsInput
                  id="skills"
                  value={form.skills}
                  onChange={(skills) => update("skills", skills)}
                />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Availability and visibility" />
            <CardBody className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field htmlFor="availability" label="Availability">
                  <Select
                    id="availability"
                    options={AVAILABILITY_OPTIONS}
                    value={form.availability}
                    onChange={(event) => update("availability", event.target.value as Availability)}
                  />
                </Field>

                <Field htmlFor="desiredEmployment" label="Looking for">
                  <Select
                    id="desiredEmployment"
                    options={EMPLOYMENT_OPTIONS}
                    placeholder="No preference"
                    value={form.desiredEmployment}
                    onChange={(event) =>
                      update("desiredEmployment", event.target.value as EmploymentType | "")
                    }
                  />
                </Field>
              </div>

              <Field
                htmlFor="profileVisibility"
                label="Profile visibility"
                hint="Public profiles can be found by employers searching for candidates. Private profiles are only visible on jobs you apply to."
              >
                <Select
                  id="profileVisibility"
                  options={[
                    { value: "PUBLIC", label: "Public — employers can find me" },
                    { value: "PRIVATE", label: "Private — hide me from search" },
                  ]}
                  value={form.profileVisibility}
                  onChange={(event) =>
                    update("profileVisibility", event.target.value as "PUBLIC" | "PRIVATE")
                  }
                />
              </Field>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <ResumeUpload currentUrl={profile.resumeUrl} onUploaded={onSaved} />
        </div>
      </div>
    </>
  );
}
