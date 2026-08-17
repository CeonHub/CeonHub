import type { Metadata } from "next";
import { EmployerDashboardScreen } from "./EmployerDashboardScreen";

export const metadata: Metadata = {
  title: "Employer dashboard",
  description: "Your CeonHub hiring dashboard: active jobs, applicants and invitations.",
  robots: { index: false },
};

export default function EmployerDashboardPage() {
  return <EmployerDashboardScreen />;
}
