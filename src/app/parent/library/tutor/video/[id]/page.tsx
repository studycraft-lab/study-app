import { notFound } from "next/navigation";
import { VideoLessonPage } from "@/components/video-lesson-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.TUTOR_ENABLED !== "true") notFound();
  return <VideoLessonPage id={(await params).id} parent />;
}
