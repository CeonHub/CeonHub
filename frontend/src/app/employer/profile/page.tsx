import type { Metadata } from "next";
import { EmployerProfileScreen } from "./EmployerProfileScreen";

export const metadata: Metadata = {
  title: "Company profile",
  description: "Manage your CeonHub company profile and hiring contact details.",
  robots: { index: false },
};

export default function EmployerProfilePage() {
  return <EmployerProfileScreen />;
}
