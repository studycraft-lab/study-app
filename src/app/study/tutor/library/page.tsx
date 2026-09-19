import { notFound } from "next/navigation";
import { ChildTutorLibrary } from "@/components/tutor-request-library";
export default async function Page({ searchParams }: { searchParams: Promise<{ chapter?: string | string[] }> }) {
  if (process.env.TUTOR_ENABLED !== "true") notFound();
  const { chapter } = await searchParams;
  return <ChildTutorLibrary chapterFilter={typeof chapter === "string" ? chapter : undefined} />;
}
