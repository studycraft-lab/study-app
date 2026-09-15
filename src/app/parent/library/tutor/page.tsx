import { notFound } from "next/navigation";
import { ParentTutorLibrary } from "@/components/parent-tutor-library";
export default function Page() {
  if (process.env.TUTOR_ENABLED !== "true") notFound();
  return <ParentTutorLibrary />;
}
