import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const CONTROL_CLASSES =
  "w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 " +
  "disabled:cursor-not-allowed disabled:bg-ink-100";

export const CONTROL_BORDER = "border-ink-200";
export const CONTROL_BORDER_ERROR = "border-danger-600";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  /** Pass the field's error message (or true) to switch on the invalid styling. */
  error?: string | boolean;
  hint?: boolean;
}

export function Input({ id, error, hint, className, ...props }: InputProps) {
  return (
    <input
      id={id}
      className={cn(CONTROL_CLASSES, error ? CONTROL_BORDER_ERROR : CONTROL_BORDER, className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      {...props}
    />
  );
}
