import type { ReactNode } from "react";

/** Consistent title block for every dashboard and list page. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
