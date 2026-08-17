import type { Metadata } from "next";
import { EmployerJobsScreen } from "./EmployerJobsScreen";

export const metadata: Metadata = {
  title: "Your jobs",
  description: "Manage the jobs your company has posted on CeonHub.",
  robots: { index: false },
};

export default function EmployerJobsPage() {
  return <EmployerJobsScreen />;
}
