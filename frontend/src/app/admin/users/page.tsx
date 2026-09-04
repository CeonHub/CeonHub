import type { Metadata } from "next";
import { AdminUsersScreen } from "./AdminUsersScreen";

export const metadata: Metadata = {
  title: "Admin users",
  description: "View and manage CeonHub user accounts.",
  robots: { index: false },
};

export default function AdminUsersPage() {
  return <AdminUsersScreen />;
}
