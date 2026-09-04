import type { Metadata } from "next";
import { AdminJobScreen } from "./AdminJobScreen";

export const metadata: Metadata = {
  title: "Manage job",
  description: "Edit a job, change its status, and review the people who applied.",
  robots: { index: false },
};

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminJobScreen jobId={id} />;
}
