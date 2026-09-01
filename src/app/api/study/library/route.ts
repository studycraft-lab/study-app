import { childFromRequest } from "@/lib/family/request";
import { listLibrary } from "@/lib/question-bank/store";
import { chapterCoverage } from "@/lib/learning/store";

export async function GET(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue.", code: "CHILD_LOGIN_REQUIRED" }, { status: 401 });
    const chapters = await listLibrary({ familyId: child.familyId, board: child.board, grade: child.grade });
    const coverage = await chapterCoverage(child.id, chapters.map((chapter) => chapter.id));
    return Response.json({ child, chapters: chapters.map((chapter) => ({ ...chapter, ...coverage[chapter.id] })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Library unavailable." }, { status: 500 });
  }
}
