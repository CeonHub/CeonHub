import type { Metadata } from "next";
import { CandidateDashboardScreen } from "./CandidateDashboardScreen";

export const metadata: Metadata = {
  title: "Candidate dashboard",
  description: "Your CeonHub dashboard: applications, private invitations and new jobs.",
  robots: { index: false },
};

export default function CandidateDashboardPage() {
  return <CandidateDashboardScreen />;
}
