import Link from "next/link";
import { Suspense } from "react";
import { StudyExperience } from "@/components/study-experience";

export default function StudyPage() {
  return <>{process.env.TUTOR_ENABLED === "true" && <p><Link href="/study/tutor/library">Tutor a textbook section</Link></p>}<Suspense fallback={<p className="study-loading">Opening your study page…</p>}><StudyExperience /></Suspense></>;
}
