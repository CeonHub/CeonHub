import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "error" | "success" | "info";

const TONES: Record<AlertTone, string> = {
  error: "border-danger-600/30 bg-danger-100 text-danger-700",
  success: "border-available-600/30 bg-available-100 text-available-700",
  info: "border-brand-600/20 bg-brand-50 text-brand-800",
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm", TONES[tone], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
