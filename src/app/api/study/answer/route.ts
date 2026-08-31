import { isChildPreviewAuthorized } from "@/lib/child-preview-auth";
import { getQuestionBank } from "@/lib/question-bank/store";
import { gradeQuestion } from "@/lib/study/session";

export async function POST(request: Request) {
  if (!isChildPreviewAuthorized(request)) return Response.json({ error: "Child preview is locked." }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.bankId !== "string" || typeof body?.questionId !== "string") {
      return Response.json({ error: "Answer request is incomplete." }, { status: 400 });
    }
    return Response.json(gradeQuestion(await getQuestionBank(body.bankId), body.questionId, body.response));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Answer could not be checked." }, { status: 500 });
  }
}
