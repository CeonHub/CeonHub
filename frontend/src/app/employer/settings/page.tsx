import type { Metadata } from "next";
import { EmployerSettingsScreen } from "./EmployerSettingsScreen";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your CeonHub employer account and password.",
  robots: { index: false },
};

export default function EmployerSettingsPage() {
  return <EmployerSettingsScreen />;
}
