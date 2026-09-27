import { childFromRequest } from "@/lib/family/request";
import { listLibrary } from "@/lib/question-bank/store";
import { adminClient } from "@/lib/supabase/admin";
import { chapterCoverage } from "@/lib/learning/store";
import { videoLessons } from "@/lib/tutor/video-store";

export async function GET(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue.", code: "CHILD_LOGIN_REQUIRED" }, { status: 401 });
    const chapters = await listLibrary({ familyId: child.familyId, board: child.board, grade: child.grade });
    const coverage = await chapterCoverage(child.id, chapters.map((chapter) => chapter.id));
    const tutorChapters = new Map<string, string>();
    if (process.env.TUTOR_ENABLED === "true" && chapters.length) {
      const { data, error } = await adminClient().from("question_banks").select("id,chapter_id").in("id", chapters.map(chapter => chapter.id));
      // A tutoring lookup must not prevent access to existing exercises.
      if (!error) for (const row of data ?? []) tutorChapters.set(row.id, row.chapter_id);
    }
    const exerciseChapters = chapters.map((chapter) => ({ ...chapter, tutorChapterId: tutorChapters.get(chapter.id), ...coverage[chapter.id] }));
    // A video may introduce a chapter before its practice bank has been prepared.
    // Failure to load optional videos must not block existing exercises.
    const videos = process.env.TUTOR_ENABLED === "true" ? await videoLessons(child.familyId, child).catch(() => []) : [];
    const seen = new Set(tutorChapters.values());
    const videoChapters = videos.flatMap(video => {
      if (seen.has(video.chapter_id) || chapters.some(ch => ch.board.toLowerCase() === video.board.toLowerCase() && ch.grade === video.grade && ch.subject.toLowerCase() === video.subject.toLowerCase() && ch.chapterTitle.toLowerCase() === video.chapter_title.toLowerCase())) return [];
      seen.add(video.chapter_id);
      return [{ id: `video-${video.chapter_id}`, tutorChapterId: video.chapter_id, board: video.board, grade: video.grade, subject: video.subject, chapterTitle: video.chapter_title, questionCount: 0, lessonOnly: true }];
    });
    return Response.json({ child, chapters: [...exerciseChapters, ...videoChapters] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Library unavailable." }, { status: 500 });
  }
}
