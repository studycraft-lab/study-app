import { childFromRequest } from "@/lib/family/request";
import { dueReviewQuestionIds } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { prepareReviewSession } from "@/lib/study/session";

export async function GET(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const due = await dueReviewQuestionIds(child.id);
    if (!due) return Response.json({ questions: [] });
    const bank = await getQuestionBankForChild(due.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    return Response.json({ bankId: due.bankId, questions: prepareReviewSession(bank, due.questionIds) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Review is unavailable." }, { status: 500 });
  }
}
