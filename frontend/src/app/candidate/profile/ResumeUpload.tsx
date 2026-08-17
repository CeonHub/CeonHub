"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { API_URL } from "@/lib/env";
import { errorMessage } from "@/lib/api";

interface ResumeUploadProps {
  currentUrl: string | null;
  onUploaded: () => void;
}

/**
 * Multipart upload, so it posts directly instead of going through apiFetch (which
 * sends JSON). The response envelope is the same.
 */
export function ResumeUpload({ currentUrl, onUploaded }: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setDone(false);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`${API_URL}/api/candidates/me/resume`, {
        method: "POST",
        credentials: "include",
        body,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? "Upload failed");
      }

      setDone(true);
      onUploaded();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardHeader title="Resume" description="PDF, Word or plain text. Up to 5 MB." />
      <CardBody className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {done && <Alert tone="success">Resume uploaded.</Alert>}

        {currentUrl ? (
          <p className="text-sm text-ink-600">
            Current resume:{" "}
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-700 hover:underline"
            >
              view file
            </a>
          </p>
        ) : (
          <p className="text-sm text-ink-500">
            No resume yet. Employers are far more likely to respond when there is one.
          </p>
        )}

        <input
          ref={inputRef}
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,text/plain"
          onChange={handleChange}
          className="sr-only"
        />
        <Button
          type="button"
          variant="secondary"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {currentUrl ? "Replace resume" : "Upload resume"}
        </Button>
      </CardBody>
    </Card>
  );
}
