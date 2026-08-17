import type { Metadata } from "next";
import { CandidateApplicationsScreen } from "./CandidateApplicationsScreen";

export const metadata: Metadata = {
  title: "Your applications",
  description: "Track the status of every job you have applied to on CeonHub.",
  robots: { index: false },
};

export default function CandidateApplicationsPage() {
  return <CandidateApplicationsScreen />;
}
