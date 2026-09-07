import { childFromRequest } from "@/lib/family/request";
import { finalizePendingStudyAttempt, pendingStudyAttempt, recordStudyAttempt, studyAttemptBySubmission } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { GradingUnavailableError } from "@/lib/ai/openrouter";
import { gradeSubmittedQuestion } from "@/lib/study/grading";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    const retryAttemptId = typeof body?.retryAttemptId === "string" && body.retryAttemptId.trim() ? body.retryAttemptId.trim() : undefined;
    const pending = retryAttemptId ? await pendingStudyAttempt(child.id, retryAttemptId) : null;
    const sessionId = pending?.sessionId ?? body?.sessionId;
    const bankId = pending?.bankId ?? body?.bankId;
    const questionId = pending?.questionId ?? body?.questionId;
    const submittedResponse = pending?.response ?? body?.response;
    if (typeof sessionId !== "string" || typeof bankId !== "string" || typeof questionId !== "string") {
      return Response.json({ error: "Answer request is incomplete." }, { status: 400 });
    }
    const submissionId = typeof body.submissionId === "string" && body.submissionId.trim() ? body.submissionId.trim() : undefined;
    if (submissionId) {
      const existing = await studyAttemptBySubmission(child.id, submissionId);
      if (existing) return Response.json({ ...existing.feedback, attemptId: existing.id, retryAvailable: existing.gradingStatus === "pending_review" });
    }
    const bank = await getQuestionBankForChild(bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    let gradingStatus: "graded" | "pending_review" = "graded";
    let feedback;
    try {
      feedback = await gradeSubmittedQuestion(bank, questionId, submittedResponse);
    } catch (error) {
      if (!(error instanceof GradingUnavailableError)) throw error;
      console.error("Automatic grading failed", { questionId, retryable: error.retryable, reason: error.message });
      gradingStatus = "pending_review";
      feedback = {
        correct: false, earnedMarks: 0, expectedAnswer: "Not graded yet",
        explanation: error.message,
        sourcePages: [], verdict: "review", reviewRequired: false, gradingPending: true, retryAvailable: error.retryable,
      };
    }
    if (pending) {
      if (gradingStatus === "graded") await finalizePendingStudyAttempt({ attemptId: pending.id, child, bankId, bank, questionId, feedback });
      return Response.json({ ...feedback, attemptId: pending.id });
    }
    const attemptId = await recordStudyAttempt({ sessionId, child, bankId, bank, questionId, response: submittedResponse, feedback, submissionId, gradingStatus });
    return Response.json({ ...feedback, attemptId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Answer could not be checked." }, { status: error instanceof GradingUnavailableError ? 503 : 500 });
  }
}
