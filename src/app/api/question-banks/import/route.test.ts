import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { importQuestionBank } = vi.hoisted(() => ({ importQuestionBank: vi.fn() }));
vi.mock("@/lib/question-bank/store", () => ({ importQuestionBank }));

import { POST } from "./route";

const bank = {
  schemaVersion: "0.1.0",
  bank: { id: "vedic-v1", version: 1, title: "Early Vedic", board: "ICSE", subject: "History", grade: 6, bookTitle: "History and Civics", chapterNumber: 5, status: "reviewed" },
  sources: [{ id: "p45", pageNumber: 45, assetRef: "manifest://test/p45", extractionConfidence: 1, reviewRequired: false, regions: [] }],
  topics: [{ id: "settlement", title: "Settlement" }],
  questions: [{
    id: "q-001", version: 1, type: "fill_blank", status: "active", prompt: "Seven rivers: ___",
    difficulty: 1, marks: 1, topicIds: ["settlement"], sourceRefs: [{ pageId: "p45", supports: ["prompt", "answer", "rubric"] }],
    response: { blankCount: 1 }, answer: { accepted: ["Sapta Sindhu"] }, rubric: { exact: true },
    hint: "Think of the seven rivers.", explanation: "The region was Sapta Sindhu.",
    generation: { method: "codex-assisted", generatedAt: "2026-09-01T00:00:00+05:30", validationStatus: "verified" },
  }],
};

describe("POST /api/question-banks/import", () => {
  afterEach(() => {
    delete process.env.PARENT_IMPORT_PASSPHRASE;
    vi.clearAllMocks();
  });

  it("imports a validated bank with parent-confirmed metadata", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    importQuestionBank.mockResolvedValue({ id: "bank-row", created: true });
    const response = await POST(new Request("http://localhost/api/question-banks/import", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" },
      body: JSON.stringify({ bank, metadata: { board: "ICSE", grade: 6, subject: "History", chapterNumber: 5, chapterTitle: "The Early Vedic Civilization" } }),
    }));

    expect(response.status).toBe(201);
    expect(importQuestionBank).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({ imported: true, created: true });
  });

  it("reports when an unattempted draft bank was replaced", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    importQuestionBank.mockResolvedValue({ id: "bank-row", created: false, replaced: true });
    const response = await POST(new Request("http://localhost/api/question-banks/import", {
      method: "POST",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" },
      body: JSON.stringify({ bank, metadata: { board: "ICSE", grade: 6, subject: "History", chapterNumber: 5, chapterTitle: "The Early Vedic Civilization" } }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ imported: true, created: false, replaced: true });
  });
});
