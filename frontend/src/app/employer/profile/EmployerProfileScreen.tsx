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
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Textarea } from "@/components/ui/Textarea";
import { ApiError, apiFetch, errorMessage } from "@/lib/api";
import type { Company, SessionUser } from "@/lib/types";
import { useApiQuery } from "@/lib/useApiQuery";
import { useAuth } from "@/providers/AuthProvider";

interface CompanyForm {
  name: string;
  description: string;
  website: string;
  logoUrl: string;
  location: string;
  country: string;
}

const EMPTY_COMPANY: CompanyForm = {
  name: "",
  description: "",
  website: "",
  logoUrl: "",
  location: "",
  country: "",
};

export function EmployerProfileScreen() {
  return (
    <Container className="py-10">
      <AuthGate roles={["EMPLOYER"]}>{(user) => <EmployerProfileForms user={user} />}</AuthGate>
    </Container>
  );
}

function EmployerProfileForms({ user }: { user: SessionUser }) {
  const query = useApiQuery<{ company: Company | null }>("/api/companies/mine");

  return (
    <>
      <PageHeader
        title="Company profile"
        description="Candidates see this on every job you publish."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {query.loading ? (
            <LoadingState label="Loading your company…" />
          ) : query.error ? (
            <ErrorState message={errorMessage(query.error)} onRetry={query.reload} />
          ) : (
            // The key re-mounts the form when the saved company changes, so its state
            // comes from props instead of an effect.
            <CompanyForm
              key={query.data?.company?.updatedAt ?? "new"}
              company={query.data?.company ?? null}
              onSaved={query.reload}
            />
          )}
        </div>

        <ContactForm user={user} />
      </div>
    </>
  );
}

function CompanyForm({ company, onSaved }: { company: Company | null; onSaved: () => void }) {
  const { refresh } = useAuth();
  const [form, setForm] = useState<CompanyForm>(() =>
    company
      ? {
          name: company.name,
          description: company.description ?? "",
          website: company.website ?? "",
          logoUrl: company.logoUrl ?? "",
          location: company.location ?? "",
          country: company.country ?? "",
        }
      : EMPTY_COMPANY,
  );
  const [error, setError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof CompanyForm>(field: K, value: CompanyForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await apiFetch<{ company: Company }>(
        company ? `/api/companies/${company.id}` : "/api/companies",
        { method: company ? "PATCH" : "POST", body: form },
      );
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
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && <Alert tone="error">{errorMessage(error)}</Alert>}
      {saved && <Alert tone="success">Company profile saved.</Alert>}
      {!company && (
        <Alert tone="info">
          Create your company profile first. It is required before you can publish a job.
        </Alert>
      )}

      <Card>
        <CardHeader title={company ? "Company details" : "Create your company"} />
        <CardBody className="space-y-5">
          <Field htmlFor="name" label="Company name" error={fieldError("name")} required>
            <Input
              id="name"
              value={form.name}
              error={fieldError("name")}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </Field>

          <Field htmlFor="description" label="About the company" error={fieldError("description")}>
            <Textarea
              id="description"
              value={form.description}
              error={fieldError("description")}
              onChange={(event) => update("description", event.target.value)}
              maxLength={4000}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field htmlFor="website" label="Website" error={fieldError("website")}>
              <Input
                id="website"
                type="url"
                placeholder="https://"
                value={form.website}
                error={fieldError("website")}
                onChange={(event) => update("website", event.target.value)}
              />
            </Field>
            <Field htmlFor="logoUrl" label="Logo URL" error={fieldError("logoUrl")}>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://"
                value={form.logoUrl}
                error={fieldError("logoUrl")}
                onChange={(event) => update("logoUrl", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field htmlFor="location" label="Location" error={fieldError("location")}>
              <Input
                id="location"
                value={form.location}
                error={fieldError("location")}
                onChange={(event) => update("location", event.target.value)}
              />
            </Field>
            <Field htmlFor="country" label="Country" error={fieldError("country")}>
              <Input
                id="country"
                value={form.country}
                error={fieldError("country")}
                onChange={(event) => update("country", event.target.value)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {company ? "Save company" : "Create company"}
        </Button>
      </div>
    </form>
  );
}

function ContactForm({ user }: { user: SessionUser }) {
  const { refresh } = useAuth();
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.employer?.title ?? "");
  const [state, setState] = useState<{ saving: boolean; saved: boolean; error: string | null }>({
    saving: false,
    saved: false,
    error: null,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ saving: true, saved: false, error: null });

    try {
      await apiFetch("/api/users/me", { method: "PATCH", body: { name, title } });
      await refresh();
      setState({ saving: false, saved: true, error: null });
    } catch (caught) {
      setState({ saving: false, saved: false, error: errorMessage(caught) });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader title="Hiring contact" description="Shown to candidates you invite." />
        <CardBody className="space-y-5">
          {state.error && <Alert tone="error">{state.error}</Alert>}
          {state.saved && <Alert tone="success">Details saved.</Alert>}

          <Field htmlFor="contact-name" label="Your name" required>
            <Input
              id="contact-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>

          <Field htmlFor="contact-title" label="Job title">
            <Input
              id="contact-title"
              value={title}
              placeholder="Head of Talent"
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <Button type="submit" variant="secondary" loading={state.saving}>
            Save details
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}
