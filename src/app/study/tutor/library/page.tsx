import { notFound } from "next/navigation";
import { ChildTutorLibrary } from "@/components/tutor-request-library";
export default function Page() {
  if (process.env.TUTOR_ENABLED !== "true") notFound();
  return <ChildTutorLibrary />;
}
