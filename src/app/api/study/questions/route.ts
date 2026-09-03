import { childFromRequest } from "@/lib/family/request";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { questionSelectionHistory } from "@/lib/learning/store";
import { selectQuestionIds, type QuestionSelectionMetadata } from "@/lib/learning/selection";
import { QUESTIONS_PER_EXERCISE } from "@/lib/study/config";
import { prepareReviewSession, selectableQuestionIds } from "@/lib/study/session";

export async function GET(request: Request) {
  const bankId = new URL(request.url).searchParams.get("bankId");
  if (!bankId) return Response.json({ error: "Choose a chapter." }, { status: 400 });
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const bank = await getQuestionBankForChild(bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    const candidateIds = selectableQuestionIds(bank);
    const questionTypes = Object.fromEntries((Array.isArray(bank.questions) ? bank.questions : [])
      .filter((question: unknown) => question && typeof question === "object" && "id" in question && "type" in question)
      .map((question: { id: unknown; type: unknown }) => [String(question.id), String(question.type)]));
    const questionMetadata: Record<string, QuestionSelectionMetadata> = Object.fromEntries((Array.isArray(bank.questions) ? bank.questions : [])
      .filter((question: unknown) => question && typeof question === "object" && "id" in question)
      .map((question: { id: unknown; origin?: unknown; selectionPriority?: unknown }) => {
        const origin = ["end_exercise", "chapter_content", "learning_outcome"].includes(String(question.origin))
          ? question.origin as QuestionSelectionMetadata["origin"]
          : undefined;
        return [String(question.id), { origin, priority: Number(question.selectionPriority) }];
      }));
    const selectedIds = selectQuestionIds(candidateIds, await questionSelectionHistory(child.id, bankId), QUESTIONS_PER_EXERCISE, Math.random, questionTypes, questionMetadata);
    const presentationSeed = crypto.randomUUID();
    return Response.json({ questions: prepareReviewSession(bank, selectedIds, presentationSeed), presentationSeed });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Questions unavailable." }, { status: 500 });
  }
}
