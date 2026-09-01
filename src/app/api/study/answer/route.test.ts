import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { childFromRequest, getQuestionBankForChild, recordStudyAttempt } = vi.hoisted(() => ({ childFromRequest: vi.fn(), getQuestionBankForChild: vi.fn(), recordStudyAttempt: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBankForChild }));
vi.mock("@/lib/learning/store", () => ({ recordStudyAttempt }));

import { POST } from "./route";

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
});
