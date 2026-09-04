import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/**
 * `secondary` describes the button's rank, not its colour. It is the quiet,
 * outlined action. `accent` is the one that paints itself in the supporting
 * brand hue (`secondary-*`), for the second call to action in a pair.
 */
export type ButtonVariant = "primary" | "accent" | "secondary" | "inverse" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold " +
  "transition-[background-color,border-color,box-shadow,transform] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

/**
 * The filled variants carry their edge as an inset ring rather than a border, so
 * the button's box stays exactly the height the size says it is. A 1px border
 * on a 44px control is the difference between a row of buttons lining up with
 * the input next to them and not.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-brand-fg shadow-control ring-1 ring-brand-edge ring-inset " +
    "hover:bg-brand-hover active:bg-brand-active",
  accent:
    "bg-accent text-accent-fg shadow-control ring-1 ring-accent-edge ring-inset " +
    "hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "bg-white text-ink-900 shadow-control ring-1 ring-ink-200 ring-inset " +
    "hover:bg-ink-50 hover:ring-ink-300",
  inverse: "bg-night-raised text-white ring-1 ring-night-line ring-inset hover:bg-night-line",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger:
    "bg-danger-600 text-white shadow-control ring-1 ring-danger-700 ring-inset " +
    "hover:bg-danger-700 active:bg-danger-800",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.9375rem]",
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

/** A link that looks like a button, used for navigation and never for actions. */
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
