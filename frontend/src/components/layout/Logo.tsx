import Image from "next/image";
import Link from "next/link";
import longLogo from "../../../public/long-logo.png";
import logoMark from "../../../public/logo-mark.png";
import { cn } from "@/lib/cn";

/**
 * The CeonHub horizontal lockup. Imported as a static asset so Next emits width,
 * height and a content hash: no layout shift, no unoptimised runtime lookup.
 *
 * The lockup is wide (roughly 4.4:1), so height drives it and width follows: at
 * the header's 32px it comes out around 142px across, which is the proportion
 * the brand kit draws it at. Below `sm` that is more width than the bar can
 * spare, so the bare mark takes over. Both are rendered and toggled with CSS
 * rather than a media query hook, which keeps this a server component.
 */
export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center rounded-control", className)}
      aria-label="CeonHub home"
    >
      <Image src={logoMark} alt="" priority className="h-8 w-8 sm:hidden" sizes="32px" />
      <Image src={longLogo} alt="" priority className="hidden h-8 w-auto sm:block" sizes="142px" />
    </Link>
  );
}
