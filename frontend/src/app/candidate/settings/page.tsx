import type { Metadata } from "next";
import { CandidateSettingsScreen } from "./CandidateSettingsScreen";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your CeonHub account and password.",
  robots: { index: false },
};

export default function CandidateSettingsPage() {
  return <CandidateSettingsScreen />;
}
