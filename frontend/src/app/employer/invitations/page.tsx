import type { Metadata } from "next";
import { EmployerInvitationsScreen } from "./EmployerInvitationsScreen";

export const metadata: Metadata = {
  title: "Invitations sent",
  description: "Private opportunities you offered to candidates, and their answers.",
  robots: { index: false },
};

export default function EmployerInvitationsPage() {
  return <EmployerInvitationsScreen />;
}
