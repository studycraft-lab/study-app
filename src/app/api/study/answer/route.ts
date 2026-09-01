import { childFromRequest } from "@/lib/family/request";
import { recordStudyAttempt } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { gradeQuestion } from "@/lib/study/session";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.sessionId !== "string" || typeof body?.bankId !== "string" || typeof body?.questionId !== "string") {
      return Response.json({ error: "Answer request is incomplete." }, { status: 400 });
    }
    const bank = await getQuestionBankForChild(body.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    const feedback = gradeQuestion(bank, body.questionId, body.response);
    const attemptId = await recordStudyAttempt({ sessionId: body.sessionId, child, bankId: body.bankId, bank, questionId: body.questionId, response: body.response, feedback });
    return Response.json({ ...feedback, attemptId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Answer could not be checked." }, { status: 500 });
  }
}
