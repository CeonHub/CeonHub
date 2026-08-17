import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_BORDER, CONTROL_BORDER_ERROR, CONTROL_CLASSES } from "./Input";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  options: SelectOption[];
  /** Shown as the first, empty option — omit for a select that always has a value. */
  placeholder?: string;
  error?: string | boolean;
}

export function Select({ id, options, placeholder, error, className, ...props }: SelectProps) {
  return (
    <select
      id={id}
      className={cn(
        CONTROL_CLASSES,
        error ? CONTROL_BORDER_ERROR : CONTROL_BORDER,
        "pr-8",
        className,
      )}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
