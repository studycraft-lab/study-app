import { childFromRequest } from "@/lib/family/request";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { questionSelectionHistory } from "@/lib/learning/store";
import { selectQuestionIds } from "@/lib/learning/selection";
import { prepareReviewSession, selectableQuestionIds } from "@/lib/study/session";

export async function GET(request: Request) {
  const bankId = new URL(request.url).searchParams.get("bankId");
  if (!bankId) return Response.json({ error: "Choose a chapter." }, { status: 400 });
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const bank = await getQuestionBankForChild(bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    const selectedIds = selectQuestionIds(selectableQuestionIds(bank), await questionSelectionHistory(child.id, bankId));
    return Response.json({ questions: prepareReviewSession(bank, selectedIds) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Questions unavailable." }, { status: 500 });
  }
}
