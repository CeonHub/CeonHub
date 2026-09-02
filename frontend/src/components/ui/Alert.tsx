import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "error" | "success" | "info";

const TONES: Record<AlertTone, string> = {
  error: "border-danger-600/30 bg-danger-100 text-danger-700",
  success: "border-available-600/30 bg-available-100 text-available-700",
  info: "border-primary-600/20 bg-primary-50 text-primary-800",
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
      className={cn("rounded-control border px-4 py-3 text-sm", TONES[tone], className)}
    >
      {title && <p className="font-bold">{title}</p>}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
