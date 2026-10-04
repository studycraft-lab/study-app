import { childFromRequest } from "@/lib/family/request";
import { createGrammarAppeal, isAppealLessonSlug } from "@/lib/english/grammar-appeals";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child || child.grade !== 6) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    const body = await request.json();
    if (!isAppealLessonSlug(body?.slug) || typeof body?.questionId !== "string" ||
      (body?.comment !== undefined && (typeof body.comment !== "string" || body.comment.length > 1000))) {
      return Response.json({ error: "A valid lesson and question are required." }, { status: 400 });
    }
    return Response.json({ appeal: await createGrammarAppeal({ child, slug: body.slug, questionId: body.questionId, comment: body.comment }) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not send the appeal." }, { status: 500 });
  }
}
