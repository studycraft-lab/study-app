import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { childFromRequest, getQuestionBankForChild, questionSelectionHistory } = vi.hoisted(() => ({ childFromRequest: vi.fn(), getQuestionBankForChild: vi.fn(), questionSelectionHistory: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBankForChild }));
vi.mock("@/lib/learning/store", () => ({ questionSelectionHistory }));

import { GET } from "./route";

describe("GET /api/study/questions", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("returns a balanced ten-question DTO without answers", async () => {
    childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    questionSelectionHistory.mockResolvedValue([]);
    getQuestionBankForChild.mockResolvedValue({ sources: [], questions: [
      ...Array.from({ length: 7 }, (_, index) => ({ id: `objective-${index}`, type: "single_choice", status: "active", prompt: "Choose", marks: 1, response: { options: [] }, answer: { correctOptionId: "a" } })),
      ...Array.from({ length: 3 }, (_, index) => ({ id: `subjective-${index}`, type: "brief_answer", status: "active", prompt: "Explain", marks: 2, answer: { ideal: "Answer" } })),
    ] });
    const response = await GET(new Request("http://localhost/api/study/questions?bankId=bank"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.questions).toHaveLength(10);
    expect(body.questions.filter((question: { type: string }) => question.type === "brief_answer")).toHaveLength(3);
    const text = JSON.stringify(body);
    expect(text).toContain('"prompt":"Choose"');
    expect(text).not.toContain("correctOptionId");
    expect(text).not.toContain('"ideal"');
  });
});
