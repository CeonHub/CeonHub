import type { Metadata } from "next";
import { CandidateProfileScreen } from "./CandidateProfileScreen";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Keep your CeonHub profile, skills, availability and resume up to date.",
  robots: { index: false },
};

export default function CandidateProfilePage() {
  return <CandidateProfileScreen />;
}
