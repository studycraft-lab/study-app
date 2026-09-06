import { childFromRequest } from "@/lib/family/request";
import { recordStudyAttempt, studyAttemptBySubmission } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { GradingUnavailableError } from "@/lib/ai/openrouter";
import { gradeSubmittedQuestion } from "@/lib/study/grading";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.sessionId !== "string" || typeof body?.bankId !== "string" || typeof body?.questionId !== "string") {
      return Response.json({ error: "Answer request is incomplete." }, { status: 400 });
    }
    const submissionId = typeof body.submissionId === "string" && body.submissionId.trim() ? body.submissionId.trim() : undefined;
    if (submissionId) {
      const existing = await studyAttemptBySubmission(child.id, submissionId);
      if (existing) return Response.json({ ...existing.feedback, attemptId: existing.id });
    }
    const bank = await getQuestionBankForChild(body.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    let gradingStatus: "graded" | "pending_review" = "graded";
    let feedback;
    try {
      feedback = await gradeSubmittedQuestion(bank, body.questionId, body.response);
    } catch (error) {
      if (!(error instanceof GradingUnavailableError)) throw error;
      gradingStatus = "pending_review";
      feedback = {
        correct: false, earnedMarks: 0, expectedAnswer: "Pending parent review",
        explanation: "Your answer was saved, but automated grading is temporarily unavailable. You can continue studying.",
        sourcePages: [], verdict: "review", reviewRequired: true, gradingPending: true,
      };
    }
    const attemptId = await recordStudyAttempt({ sessionId: body.sessionId, child, bankId: body.bankId, bank, questionId: body.questionId, response: body.response, feedback, submissionId, gradingStatus });
    return Response.json({ ...feedback, attemptId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Answer could not be checked." }, { status: error instanceof GradingUnavailableError ? 503 : 500 });
  }
}
