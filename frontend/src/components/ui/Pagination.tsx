import Link from "next/link";
import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Server-rendered lists pass this to keep pagination in the URL. */
  hrefFor?: (page: number) => string;
  /** Client-rendered lists pass this instead. */
  onPageChange?: (page: number) => void;
  className?: string;
}

const ITEM =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium";

export function Pagination({ page, totalPages, hrefFor, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav className={cn("flex items-center justify-center gap-1", className)} aria-label="Pagination">
      <PageControl
        page={page - 1}
        disabled={page <= 1}
        hrefFor={hrefFor}
        onPageChange={onPageChange}
        label="Previous page"
      >
        ←
      </PageControl>

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-ink-400">
            …
          </span>
        ) : (
          <PageControl
            key={entry}
            page={entry}
            current={entry === page}
            hrefFor={hrefFor}
            onPageChange={onPageChange}
            label={`Page ${entry}`}
          >
            {entry}
          </PageControl>
        ),
      )}

      <PageControl
        page={page + 1}
        disabled={page >= totalPages}
        hrefFor={hrefFor}
        onPageChange={onPageChange}
        label="Next page"
      >
        →
      </PageControl>
    </nav>
  );
}

function PageControl({
  page,
  label,
  children,
  current = false,
  disabled = false,
  hrefFor,
  onPageChange,
}: {
  page: number;
  label: string;
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
  hrefFor?: (page: number) => string;
  onPageChange?: (page: number) => void;
}) {
  const className = cn(
    ITEM,
    current
      ? "border-brand-edge bg-brand text-brand-fg"
      : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
    disabled && "pointer-events-none opacity-40",
  );

  if (hrefFor && !disabled) {
    return (
      <Link
        href={hrefFor(page)}
        className={className}
        aria-label={label}
        aria-current={current ? "page" : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      onClick={onPageChange ? () => onPageChange(page) : undefined}
    >
      {children}
    </button>
  );
}

/** First, last, current and its neighbours — with gaps in between. */
function pageWindow(page: number, totalPages: number): Array<number | "gap"> {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push("gap");
    result.push(value);
    previous = value;
  }
  return result;
}
