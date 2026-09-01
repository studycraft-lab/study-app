import { childFromRequest } from "@/lib/family/request";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { gradeQuestion } from "@/lib/study/session";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.bankId !== "string" || typeof body?.questionId !== "string") {
      return Response.json({ error: "Answer request is incomplete." }, { status: 400 });
    }
    return Response.json(gradeQuestion(await getQuestionBankForChild(body.bankId, { familyId: child.familyId, board: child.board, grade: child.grade }), body.questionId, body.response));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Answer could not be checked." }, { status: 500 });
  }
}
