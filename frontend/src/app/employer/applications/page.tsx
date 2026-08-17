import type { Metadata } from "next";
import { Suspense } from "react";
import { EmployerApplicationsScreen } from "./EmployerApplicationsScreen";
import { LoadingState } from "@/components/ui/States";

export const metadata: Metadata = {
  title: "Applicants",
  description: "Review everyone who applied to your jobs on CeonHub.",
  robots: { index: false },
};

export default function EmployerApplicationsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EmployerApplicationsScreen />
    </Suspense>
  );
}
