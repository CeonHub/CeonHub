import type { Metadata } from "next";
import { AdminJobsScreen } from "./AdminJobsScreen";

export const metadata: Metadata = {
  title: "Admin — jobs",
  description: "Review and moderate the jobs posted on CeonHub.",
  robots: { index: false },
};

export default function AdminJobsPage() {
  return <AdminJobsScreen />;
}
