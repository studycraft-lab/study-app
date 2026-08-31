import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { getQuestionBank } = vi.hoisted(() => ({ getQuestionBank: vi.fn() }));
vi.mock("@/lib/question-bank/store", () => ({ getQuestionBank }));

import { childPreviewCookie } from "@/lib/child-preview-auth";
import { POST } from "./route";

describe("POST /api/study/answer", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("grades on the server and returns cited feedback", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    getQuestionBank.mockResolvedValue({ sources: [{ id: "p", pageNumber: 45 }], questions: [{ id: "q", type: "fill_blank", prompt: "Seven rivers", marks: 1, answer: { accepted: ["Sapta Sindhu"] }, sourceRefs: [{ pageId: "p" }] }] });
    const response = await POST(new Request("http://localhost/api/study/answer", { method: "POST", headers: { "content-type": "application/json", cookie: childPreviewCookie() }, body: JSON.stringify({ bankId: "bank", questionId: "q", response: "wrong" }) }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ correct: false, expectedAnswer: "Sapta Sindhu", sourcePages: [45] });
  });
});
