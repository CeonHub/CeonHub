import type { Metadata } from "next";
import { AdminCompaniesScreen } from "./AdminCompaniesScreen";

export const metadata: Metadata = {
  title: "Admin companies",
  description: "Create and review the companies that jobs are posted under.",
  robots: { index: false },
};

export default function AdminCompaniesPage() {
  return <AdminCompaniesScreen />;
}
