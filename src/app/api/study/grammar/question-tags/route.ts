import { childFromRequest } from "@/lib/family/request";
import { QUESTION_TAGS_LESSON, gradeQuestionTagBatch, publicQuestion } from "@/lib/english/question-tags";
import { clearQuestionTagProgress, loadQuestionTagProgress, saveQuestionTagProgress } from "@/lib/english/progress-store";

async function signedInChild(request: Request) {
  const child = await childFromRequest(request);
  return child?.grade === QUESTION_TAGS_LESSON.grade ? child : null;
}

function unavailable(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : "Question Tags is unavailable." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const child = await signedInChild(request);
    if (!child) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    const batches = await loadQuestionTagProgress(child.id);
    return Response.json({
      child: { displayName: child.displayName },
      lesson: { slug: QUESTION_TAGS_LESSON.slug, version: QUESTION_TAGS_LESSON.version, subject: QUESTION_TAGS_LESSON.subject, title: QUESTION_TAGS_LESSON.title, batchSize: QUESTION_TAGS_LESSON.batchSize },
      questions: QUESTION_TAGS_LESSON.questions.map(publicQuestion),
      batches,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}

export async function POST(request: Request) {
  try {
    const child = await signedInChild(request);
    if (!child) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    const body = await request.json();
    if (!Number.isInteger(body?.batchIndex) || !Array.isArray(body?.answers)) return Response.json({ error: "Invalid Question Tags batch." }, { status: 400 });
    try { gradeQuestionTagBatch(body.batchIndex, body.answers); }
    catch { return Response.json({ error: "Invalid Question Tags batch." }, { status: 400 }); }
    const batch = await saveQuestionTagProgress(child.id, body.batchIndex, body.answers);
    return Response.json({ batch }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid JSON." }, { status: 400 });
    return unavailable(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const child = await signedInChild(request);
    if (!child) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    await clearQuestionTagProgress(child.id);
    return Response.json({ cleared: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
