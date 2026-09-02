import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const CONTROL_CLASSES =
  "w-full rounded-control border bg-white px-3.5 py-2.5 text-sm text-ink-950 transition-colors " +
  "placeholder:text-ink-500 disabled:cursor-not-allowed disabled:bg-ink-100";

export const CONTROL_BORDER = "border-ink-200 hover:border-ink-300 focus:border-primary-500";
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
