import { childFromRequest } from "@/lib/family/request";
import { deletePythonProgress, loadPythonProgress, savePythonProgress } from "@/lib/python/progress-store";
import { EXTRA_PROGRAMS } from "@/lib/python/extra-programs";
import bank from "../../../../../ingestion-artifacts/python-conditional-statements-question-bank.json";

const questions = new Map([...bank.questions, ...EXTRA_PROGRAMS].map((question) => [question.id, question]));
async function child(request: Request) {
  const profile = await childFromRequest(request);
  if (!profile) return null;
  return profile.grade === 6 ? profile : null;
}
function validId(value: unknown): value is string { return typeof value === "string" && questions.has(value); }
function responseError(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : "Python progress is unavailable." }, { status: 503 });
}

export async function GET(request: Request) {
  try {
    const profile = await child(request);
    if (!profile) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    return Response.json({ entries: await loadPythonProgress(profile.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return responseError(error); }
}

export async function PUT(request: Request) {
  try {
    const profile = await child(request);
    if (!profile) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    const body = await request.json();
    if (!validId(body?.questionId) || typeof body.answer !== "string" || body.answer.length > 10000 || typeof body.checked !== "boolean" || typeof body.passed !== "boolean")
      return Response.json({ error: "Invalid practice answer." }, { status: 400 });
    const question = questions.get(body.questionId)!;
    if (body.passed && question.response.editor !== "python") return Response.json({ error: "Invalid program status." }, { status: 400 });
    if (body.answer.length > (question.response.editor === "python" ? 10000 : 2000)) return Response.json({ error: "Answer is too long." }, { status: 400 });
    const item = await savePythonProgress(profile.id, { questionId: body.questionId, answer: body.answer, checked: body.checked, passed: body.passed });
    return Response.json({ item }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid JSON." }, { status: 400 });
    return responseError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await child(request);
    if (!profile) return Response.json({ error: "Class VI child sign-in required." }, { status: 401 });
    const questionId = new URL(request.url).searchParams.get("questionId");
    if (!validId(questionId)) return Response.json({ error: "Choose a practice question." }, { status: 400 });
    await deletePythonProgress(profile.id, questionId);
    return Response.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return responseError(error); }
}
