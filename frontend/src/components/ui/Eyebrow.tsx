import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The small labelled pill that opens a section. The dot is always the untouched
 * logo green; the text next to it steps down the ramp far enough to stay legible
 * at 11px, which the logo ink itself does not on a light tint.
 */
export function Eyebrow({
  tone = "light",
  className,
  children,
}: {
  tone?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-eyebrow inline-flex items-center gap-2 rounded-full px-3 py-1.5",
        tone === "dark"
          ? "bg-logo-green/10 text-logo-green"
          : "bg-secondary-100 text-secondary-600",
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-logo-green" />
      {children}
    </p>
  );
}
