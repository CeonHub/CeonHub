import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/**
 * `secondary` describes the button's rank, not its colour — it is the quiet,
 * outlined action. `accent` is the one that paints itself in the supporting
 * brand hue (`secondary-*`), for the second call to action in a pair.
 */
export type ButtonVariant = "primary" | "accent" | "secondary" | "inverse" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border border-brand-edge bg-brand text-brand-fg shadow-card hover:bg-brand-hover active:bg-brand-active",
  accent:
    "border border-accent-edge bg-accent text-accent-fg shadow-card hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "border border-ink-200 bg-white text-ink-800 shadow-card hover:border-ink-300 hover:bg-ink-50",
  inverse: "border border-white/25 bg-transparent text-white hover:bg-white/10",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger:
    "border border-danger-700 bg-danger-600 text-white shadow-card hover:bg-danger-700 active:bg-danger-800",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/** A link that looks like a button — used for navigation, never for actions. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
