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
        "flex items-center justify-center gap-3 rounded-card border border-ink-200 bg-white px-6 py-12 text-sm text-ink-500",
        className,
      )}
      role="status"
    >
      <Spinner className="h-5 w-5 text-brand-600" />
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
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-dashed border-ink-300 bg-white px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
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
        "rounded-card border border-danger-600/30 bg-danger-100 px-6 py-8 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-danger-700">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-danger-700/90">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-danger-600/40 bg-white px-3 py-1.5 text-sm font-medium text-danger-700 hover:bg-danger-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
