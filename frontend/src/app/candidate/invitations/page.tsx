import type { Metadata } from "next";
import { CandidateInvitationsScreen } from "./CandidateInvitationsScreen";

export const metadata: Metadata = {
  title: "Private invitations",
  description: "Private opportunities employers have offered you directly on CeonHub.",
  robots: { index: false },
};

export default function CandidateInvitationsPage() {
  return <CandidateInvitationsScreen />;
}
