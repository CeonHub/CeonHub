import type { ReactNode } from "react";

interface FieldProps {
  /** Must match the id of the control it wraps; the error message uses `${id}-error`. */
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + control + hint/error. Controls (Input, Select, Textarea) derive their
 * aria-describedby from the same id, so messages are announced by screen readers.
 */
export function Field({ htmlFor, label, hint, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-800">
        {label}
        {required && (
          <span className="ml-0.5 text-danger-600" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
