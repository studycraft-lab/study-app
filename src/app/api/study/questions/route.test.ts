import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { getQuestionBank } = vi.hoisted(() => ({ getQuestionBank: vi.fn() }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBank }));

import { childPreviewCookie } from "@/lib/child-preview-auth";
import { GET } from "./route";

describe("GET /api/study/questions", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("returns a five-question DTO without answers", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    getQuestionBank.mockResolvedValue({ sources: [], questions: [{ id: "q", type: "single_choice", status: "active", prompt: "Choose", marks: 1, response: { options: [] }, answer: { correctOptionId: "a" } }] });
    const response = await GET(new Request("http://localhost/api/study/questions?bankId=bank", { headers: { cookie: childPreviewCookie() } }));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('"prompt":"Choose"');
    expect(text).not.toContain("correctOptionId");
  });
});
