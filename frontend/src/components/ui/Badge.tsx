import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "available" | "immediate" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  primary: "bg-primary-50 text-primary-800 ring-primary-200",
  available: "bg-available-100 text-available-700 ring-available-600/20",
  immediate: "bg-immediate-100 text-immediate-700 ring-immediate-600/20",
  danger: "bg-danger-100 text-danger-700 ring-danger-600/20",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
