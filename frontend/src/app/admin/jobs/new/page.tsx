import type { Metadata } from "next";
import { AdminNewJobScreen } from "./AdminNewJobScreen";

export const metadata: Metadata = {
  title: "Post a job",
  description: "Publish a job on behalf of a company, or save it as a draft.",
  robots: { index: false },
};

export default function AdminNewJobPage() {
  return <AdminNewJobScreen />;
}
