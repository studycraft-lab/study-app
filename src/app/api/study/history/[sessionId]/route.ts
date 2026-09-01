import { childFromRequest } from "@/lib/family/request";
import { studySessionReview } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import type { StudyQuestion } from "@/lib/study/session";

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordValue : {};
}

function optionText(question: StudyQuestion, id: unknown): string {
  const options = Array.isArray(question.response.options) ? question.response.options.map(record) : [];
  const option = options.find((candidate) => candidate.id === id);
  return String(option?.text ?? id ?? "");
}

function reviewQuestions(bankValue: unknown, questionIds: string[]): StudyQuestion[] {
  const questions = Array.isArray(record(bankValue).questions) ? (record(bankValue).questions as unknown[]).map(record) : [];
  const byId = new Map(questions.map((question) => [String(question.id), question]));
  return questionIds.map((id) => byId.get(id)).filter((question): question is RecordValue => Boolean(question)).map((question) => ({
    id: String(question.id), type: String(question.type), prompt: String(question.prompt ?? "Question unavailable"),
    marks: Number(question.marks ?? 0), response: record(question.response),
  }));
}

function readableResponse(question: StudyQuestion, response: unknown): string {
  if (question.type === "single_choice") return optionText(question, response);
  if (question.type === "multiple_select") return (Array.isArray(response) ? response : []).map((id) => optionText(question, id)).join(", ");
  if (question.type === "true_false_correct") {
    const answer = record(response);
    const value = answer.value === true ? "True" : answer.value === false ? "False" : "No answer";
    return answer.value === false && answer.correction ? `${value} — ${String(answer.correction)}` : value;
  }
  if (question.type === "matching") {
    const matches = record(response);
    const left = Array.isArray(question.response.left) ? question.response.left.map(record) : [];
    const right = Array.isArray(question.response.right) ? question.response.right.map(record) : [];
    return Object.entries(matches).map(([leftId, rightId]) => {
      const leftText = left.find((item) => item.id === leftId)?.text ?? leftId;
      const rightText = right.find((item) => item.id === rightId)?.text ?? rightId;
      return `${String(leftText)} → ${String(rightText)}`;
    }).join("; ");
  }
  return typeof response === "string" ? response : JSON.stringify(response ?? "");
}

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const { sessionId } = await context.params;
    const session = await studySessionReview(sessionId, child.id);
    const bank = await getQuestionBankForChild(session.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    const questions = reviewQuestions(bank, session.questionIds);
    const byId = new Map(questions.map((question) => [question.id, question]));
    return Response.json({
      id: session.id, status: session.status, startedAt: session.startedAt, totalQuestions: session.totalQuestions,
      resumable: session.status === "in_progress",
      attempts: session.attempts.map((attempt) => {
        const question = byId.get(String(attempt.question_id));
        const feedback = record(attempt.feedback);
        const earnedMarks = Number(attempt.earned_marks);
        const maxMarks = Number(attempt.max_marks);
        return {
          id: String(attempt.id), prompt: question?.prompt ?? "Question unavailable", answer: question ? readableResponse(question, attempt.response) : String(attempt.response ?? ""),
          correct: Boolean(attempt.correct), earnedMarks, maxMarks,
          status: feedback.reviewRequired ? "Needs parent review" : attempt.correct ? "Correct" : earnedMarks > 0 ? "Partly correct" : "Incorrect",
          correctAnswer: String(feedback.expectedAnswer ?? "Not available"), explanation: String(feedback.explanation ?? ""),
          sourcePages: Array.isArray(feedback.sourcePages) ? feedback.sourcePages : [],
        };
      }),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Session review is unavailable." }, { status: 500 });
  }
}
