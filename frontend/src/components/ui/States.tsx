import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/**
 * The three states every data view needs. Using them consistently is what keeps
 * failed requests from turning into blank screens.
 */

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 rounded-card border border-ink-200 bg-white px-6 py-14 text-sm text-ink-600",
        className,
      )}
      role="status"
    >
      <Spinner className="h-5 w-5 text-primary-600" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-card border border-ink-200 bg-white px-6 py-14 text-center", className)}
    >
      {/* A neutral chip rather than a per-state illustration: it gives the block a
          focal point at any width without pretending the emptiness means
          something specific. */}
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-600"
      >
        <InboxIcon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-bold text-ink-950">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-card border border-danger-600/30 bg-danger-100 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="font-bold text-danger-700">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-danger-700/90">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-control border border-danger-600/40 bg-white px-4 py-2 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 13h4l1.5 3h7L17 13h4" />
      <path d="M4.4 6.6 3 13v4.5A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5V13l-1.4-6.4A2 2 0 0 0 17.65 5H6.35a2 2 0 0 0-1.95 1.6Z" />
    </svg>
  );
}
