import type { Metadata } from "next";
import { EmployerCandidatesScreen } from "./EmployerCandidatesScreen";

export const metadata: Metadata = {
  title: "Find candidates",
  description: "Search available candidates and invite them to private opportunities.",
  robots: { index: false },
};

export default function EmployerCandidatesPage() {
  return <EmployerCandidatesScreen />;
}
