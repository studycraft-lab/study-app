import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { childFromRequest, getQuestionBankForChild, questionSelectionHistory } = vi.hoisted(() => ({ childFromRequest: vi.fn(), getQuestionBankForChild: vi.fn(), questionSelectionHistory: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBankForChild }));
vi.mock("@/lib/learning/store", () => ({ questionSelectionHistory }));

import { GET } from "./route";

describe("GET /api/study/questions", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("returns a five-question DTO without answers", async () => {
    childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    questionSelectionHistory.mockResolvedValue([]);
    getQuestionBankForChild.mockResolvedValue({ sources: [], questions: [{ id: "q", type: "single_choice", status: "active", prompt: "Choose", marks: 1, response: { options: [] }, answer: { correctOptionId: "a" } }] });
    const response = await GET(new Request("http://localhost/api/study/questions?bankId=bank"));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('"prompt":"Choose"');
    expect(text).not.toContain("correctOptionId");
  });
});
