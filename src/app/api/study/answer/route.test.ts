import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { childFromRequest, getQuestionBankForChild, recordStudyAttempt, classifyRubric } = vi.hoisted(() => ({ childFromRequest: vi.fn(), getQuestionBankForChild: vi.fn(), recordStudyAttempt: vi.fn(), classifyRubric: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBankForChild }));
vi.mock("@/lib/learning/store", () => ({ recordStudyAttempt }));
vi.mock("@/lib/ai/openrouter", async () => ({ ...(await vi.importActual<typeof import("@/lib/ai/openrouter")>("@/lib/ai/openrouter")), classifyRubric }));

import { POST } from "./route";
import { GradingUnavailableError } from "@/lib/ai/openrouter";

describe("POST /api/study/answer", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("grades on the server and returns cited feedback", async () => {
    childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    getQuestionBankForChild.mockResolvedValue({ sources: [{ id: "p", pageNumber: 45 }], questions: [{ id: "q", type: "fill_blank", prompt: "Seven rivers", marks: 1, answer: { accepted: ["Sapta Sindhu"] }, sourceRefs: [{ pageId: "p" }] }] });
    recordStudyAttempt.mockResolvedValue("attempt");
    const response = await POST(new Request("http://localhost/api/study/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: "session", bankId: "bank", questionId: "q", response: "wrong" }) }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ correct: false, expectedAnswer: "Sapta Sindhu", sourcePages: [45], attemptId: "attempt" });
  });

  it("uses AI only for a rubric-based free-text answer", async () => {
    childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    getQuestionBankForChild.mockResolvedValue({ sources: [{ id: "p", pageNumber: 47 }], questions: [{ id: "q", type: "brief_answer", prompt: "What did the sabha do?", marks: 1, answer: { ideal: "It advised the rajan." }, rubric: { points: [{ id: "p1", concept: "sabha advised the rajan", weight: 1 }] }, sourceRefs: [{ pageId: "p" }] }] });
    classifyRubric.mockResolvedValue({ points: [{ id: "p1", coverage: "covered", confidence: 0.95 }], feedback: "Correct idea.", confidence: 0.95, spellingErrors: [], grammarErrors: [], meta: { provider: "openrouter", model: "test", promptTokens: 10, completionTokens: 5, totalTokens: 15, cost: 0.001, latencyMs: 20 } });
    recordStudyAttempt.mockResolvedValue("attempt");
    const response = await POST(new Request("http://localhost/api/study/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: "session", bankId: "bank", questionId: "q", response: "It guided the king." }) }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ correct: true, earnedMarks: 1, coveredPoints: ["sabha advised the rajan"] });
    expect(classifyRubric).toHaveBeenCalledOnce();
    expect(recordStudyAttempt).toHaveBeenCalledWith(expect.objectContaining({ feedback: expect.objectContaining({ gradingMeta: expect.objectContaining({ provider: "openrouter", promptTokens: 10, cost: 0.001 }) }) }));
  });

  it("does not record a false result when the provider fails", async () => {
    childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    getQuestionBankForChild.mockResolvedValue({ sources: [{ id: "p", pageNumber: 47 }], questions: [{ id: "q", type: "brief_answer", prompt: "Explain", marks: 1, answer: { ideal: "Answer" }, rubric: { points: [{ id: "p1", concept: "answer", weight: 1 }] }, sourceRefs: [{ pageId: "p" }] }] });
    classifyRubric.mockRejectedValue(new GradingUnavailableError("AI grading timed out. Please try again."));
    const response = await POST(new Request("http://localhost/api/study/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: "session", bankId: "bank", questionId: "q", response: "My answer" }) }));
    expect(response.status).toBe(503);
    expect(recordStudyAttempt).not.toHaveBeenCalled();
  });
});
