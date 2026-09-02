import { cn } from "@/lib/cn";

/**
 * Company logos are arbitrary external URLs supplied by employers, so they are
 * rendered with a plain <img> rather than next/image: optimising them would mean
 * allowing the image proxy to fetch any host on the internet.
 */
export function CompanyLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const classes = cn(
    "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-control border border-ink-200 bg-ink-50",
    className,
  );

  if (!logoUrl) {
    return (
      <div className={classes} aria-hidden="true">
        <span className="text-lg font-semibold text-ink-500">{name.slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={classes}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={48}
        height={48}
        loading="lazy"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
