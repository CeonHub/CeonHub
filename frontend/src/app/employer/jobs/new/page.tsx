import type { Metadata } from "next";
import { NewJobScreen } from "./NewJobScreen";

export const metadata: Metadata = {
  title: "Post a job",
  description: "Create a new job on CeonHub and publish it or keep it as a draft.",
  robots: { index: false },
};

export default function NewJobPage() {
  return <NewJobScreen />;
}
