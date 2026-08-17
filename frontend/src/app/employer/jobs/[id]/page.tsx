import type { Metadata } from "next";
import { EmployerJobScreen } from "./EmployerJobScreen";

export const metadata: Metadata = {
  title: "Manage job",
  description: "Edit a job, change its status and review the people who applied.",
  robots: { index: false },
};

export default async function EmployerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployerJobScreen jobId={id} />;
}
