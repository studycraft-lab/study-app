import { childFromRequest } from "@/lib/family/request";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
import { loadProgress } from "@/lib/tutor/progress-store";
import { answerSectionQuestion } from "@/lib/tutor/section-question";
import { reserveSectionQuestion } from "@/lib/tutor/section-question-usage";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) throw new TutorError("Child sign-in required.", 401);
    requireTutorEnabled();
    const body = await readTutorJSON(request, 2048);
    if (!uuid(body.progressId) || typeof body.question !== "string" || body.question.trim().length < 3 || body.question.length > 300) throw new TutorError("Type a short question about this lesson.");
    const { pack } = await loadProgress(child, body.progressId);
    await reserveSectionQuestion(child.id, body.progressId);
    return Response.json(await answerSectionQuestion(pack, child.id, body.question.trim()), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return tutorError(error); }
}
