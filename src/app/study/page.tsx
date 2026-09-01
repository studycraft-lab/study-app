import { Suspense } from "react";
import { StudyExperience } from "@/components/study-experience";

export default function StudyPage() {
  return <Suspense fallback={<p className="study-loading">Opening your study space…</p>}><StudyExperience /></Suspense>;
}
