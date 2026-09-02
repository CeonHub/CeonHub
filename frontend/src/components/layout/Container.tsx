import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** One page width for the whole product, so pages line up with each other. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>{children}</div>
  );
}
