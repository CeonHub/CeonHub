import type { Metadata } from "next";
import { AdminOverviewScreen } from "./AdminOverviewScreen";

export const metadata: Metadata = {
  title: "Admin overview",
  description: "Platform statistics for CeonHub administrators.",
  robots: { index: false },
};

export default function AdminPage() {
  return <AdminOverviewScreen />;
}
