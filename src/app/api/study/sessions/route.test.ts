import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ childFromRequest: vi.fn(), getQuestionBankForChild: vi.fn(), createStudySession: vi.fn(), resumableStudySession: vi.fn(), completeStudySession: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: mocks.childFromRequest }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBankForChild: mocks.getQuestionBankForChild }));
vi.mock("@/lib/learning/store", () => ({ createStudySession: mocks.createStudySession, resumableStudySession: mocks.resumableStudySession, completeStudySession: mocks.completeStudySession }));

import { GET, POST } from "./route";

const bank = { bank: { version: 1 }, questions: [{ id: "q1", type: "fill_blank", status: "active", prompt: "One", marks: 1, response: {} }] };

describe("study sessions", () => {
  afterEach(() => vi.clearAllMocks());

  it("stores the exact validated question selection", async () => {
    mocks.childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    mocks.getQuestionBankForChild.mockResolvedValue(bank);
    mocks.createStudySession.mockResolvedValue("session");
    const response = await POST(new Request("http://localhost/api/study/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bankId: "bank", questionIds: ["q1"] }) }));
    expect(response.status).toBe(201);
    expect(mocks.createStudySession).toHaveBeenCalledWith(expect.objectContaining({ questionIds: ["q1"] }));
  });

  it("returns stored questions and attempts for resume", async () => {
    mocks.childFromRequest.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
    mocks.resumableStudySession.mockResolvedValue({ bankId: "bank", questionIds: ["q1"], attempts: [{ question_id: "q1" }] });
    mocks.getQuestionBankForChild.mockResolvedValue(bank);
    const response = await GET(new Request("http://localhost/api/study/sessions?sessionId=session"));
    await expect(response.json()).resolves.toMatchObject({ bankId: "bank", questions: [{ id: "q1" }], attempts: [{ question_id: "q1" }] });
  });
});
