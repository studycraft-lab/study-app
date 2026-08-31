import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "./route";

const validBank = {
  schemaVersion: "0.1.0",
  bank: {
    id: "early-vedic-v1",
    version: 1,
    title: "The Early Vedic Civilization",
    board: "ICSE",
    grade: 6,
    subject: "History",
    chapterNumber: 5,
    status: "draft",
  },
  sources: [{ id: "page-45", pageNumber: 45, regions: [] }],
  topics: [{ id: "settlement", title: "Aryan settlement" }],
  questions: [
    {
      id: "q-1",
      version: 1,
      type: "fill_blank",
      status: "active",
      topicIds: ["settlement"],
      marks: 1,
      prompt: "The region of seven rivers was called ____.",
      sourceRefs: [{ pageId: "page-45", supports: ["prompt", "answer"] }],
      answer: { accepted: ["Sapta Sindhu"] },
      rubric: { exact: true },
    },
  ],
};

describe("POST /api/question-banks/validate", () => {
  afterEach(() => {
    delete process.env.PARENT_IMPORT_PASSPHRASE;
  });

  it("returns a parent-friendly preview for a grounded bank", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "family-secret";
    const response = await POST(
      new Request("http://localhost/api/question-banks/validate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studycraft-parent-passphrase": "family-secret",
        },
        body: JSON.stringify(validBank),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      preview: {
        board: "ICSE",
        grade: 6,
        subject: "History",
        chapterNumber: 5,
        chapterTitle: "The Early Vedic Civilization",
        questionCount: 1,
        sourceCount: 1,
      },
      errors: [],
    });
  });

  it("rejects a question whose source citation is missing", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "family-secret";
    const invalidBank = structuredClone(validBank);
    invalidBank.questions[0].sourceRefs[0].pageId = "page-99";

    const response = await POST(
      new Request("http://localhost/api/question-banks/validate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-studycraft-parent-passphrase": "family-secret",
        },
        body: JSON.stringify(invalidBank),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      valid: false,
      errors: [expect.stringContaining("page-99")],
    });
  });
});
