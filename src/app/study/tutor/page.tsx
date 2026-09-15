import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChildTutorLesson } from "@/components/child-tutor-lesson";
export default function Page() {
  if (process.env.TUTOR_ENABLED !== "true") notFound();
  return <Suspense fallback={<p>Opening lesson…</p>}><ChildTutorLesson /></Suspense>;
}
