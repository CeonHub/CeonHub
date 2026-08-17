import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_BORDER, CONTROL_BORDER_ERROR, CONTROL_CLASSES } from "./Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  error?: string | boolean;
  hint?: boolean;
}

export function Textarea({ id, error, hint, className, rows = 5, ...props }: TextareaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      className={cn(CONTROL_CLASSES, error ? CONTROL_BORDER_ERROR : CONTROL_BORDER, className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      {...props}
    />
  );
}
