import Link from "next/link";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
}

export function StatCard({ label, value, hint, href }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-500">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-card border border-ink-200 bg-white p-5 transition-colors hover:border-brand-300"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-card border border-ink-200 bg-white p-5">{content}</div>;
}
