import type { Metadata } from "next";
import { CandidateJobsScreen } from "./CandidateJobsScreen";

export const metadata: Metadata = {
  title: "Jobs for you",
  description: "Jobs matched to the skills and availability on your CeonHub profile.",
  robots: { index: false },
};

export default function CandidateJobsPage() {
  return <CandidateJobsScreen />;
}
