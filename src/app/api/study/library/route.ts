import { childFromRequest } from "@/lib/family/request";
import { listLibrary } from "@/lib/question-bank/store";
import { adminClient } from "@/lib/supabase/admin";
import { chapterCoverage } from "@/lib/learning/store";

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
    return Response.json({ child, chapters: chapters.map((chapter) => ({ ...chapter, tutorChapterId: tutorChapters.get(chapter.id), ...coverage[chapter.id] })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Library unavailable." }, { status: 500 });
  }
}
