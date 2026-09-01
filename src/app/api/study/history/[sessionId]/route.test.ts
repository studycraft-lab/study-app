import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ childFromRequest: vi.fn(), studySessionReview: vi.fn(), getQuestionBankForChild: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: mocks.childFromRequest }));
vi.mock("@/lib/learning/store", () => ({ studySessionReview: mocks.studySessionReview }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBankForChild: mocks.getQuestionBankForChild }));

import { GET } from "./route";

describe("GET /api/study/history/:sessionId", () => {
  it("returns human-readable submitted and correct answers", async () => {
    mocks.childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    mocks.studySessionReview.mockResolvedValue({ id: "session", bankId: "bank", status: "completed", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 1, questionIds: ["q1"], attempts: [{ id: "attempt", question_id: "q1", response: "later", correct: false, earned_marks: 0, max_marks: 1, feedback: { expectedAnswer: "Early Vedic", explanation: "Check the timeline.", sourcePages: [49] } }] });
    mocks.getQuestionBankForChild.mockResolvedValue({ questions: [{ id: "q1", type: "single_choice", prompt: "Which period?", marks: 1, response: { options: [{ id: "early", text: "Early Vedic" }, { id: "later", text: "Later Vedic" }] } }] });

    const response = await GET(new Request("http://localhost/api/study/history/session"), { params: Promise.resolve({ sessionId: "session" }) });

    await expect(response.json()).resolves.toMatchObject({ attempts: [{ answer: "Later Vedic", correctAnswer: "Early Vedic", status: "Incorrect" }] });
  });
});
