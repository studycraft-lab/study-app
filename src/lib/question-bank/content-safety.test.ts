import { describe, expect, it } from "vitest";

import { validateQuestionBank } from "./validate";

function bankWith(prompt: string, overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "0.1.0",
    bank: { id: "test-bank", version: 1, title: "Test chapter", board: "ICSE", subject: "Science", grade: 6, bookTitle: "Test book", chapterNumber: 1, status: "reviewed" },
    sources: [{
      id: "page-1", pageNumber: 1, assetRef: "manifest://page-1", extractionConfidence: 1, reviewRequired: false,
      regions: [{ id: "case-study", kind: "passage", bounds: { x: 0, y: 0, width: 1, height: 1 }, runtimeAssetRef: "private://page-1/case-study" }],
    }],
    topics: [{ id: "cells", title: "Cells" }],
    questions: [{
      id: "q-001", version: 1, type: "single_choice", status: "active", topicIds: ["cells"], difficulty: 1, marks: 1, prompt,
      sourceRefs: [{ pageId: "page-1", supports: ["prompt", "answer", "rubric"] }],
      response: { options: [{ id: "a", text: "A" }, { id: "b", text: "B" }] }, answer: { correctOptionId: "a" }, rubric: { exact: true },
      hint: "Recall the relevant fact.", explanation: "A is correct.",
      generation: { method: "codex-assisted", generatedAt: "2026-09-06T00:00:00.000Z", validationStatus: "verified" },
      ...overrides,
    }],
  };
}

describe("question-bank content safety", () => {
  it.each([
    "Which organism cannot contain the plant cell P shown in the case study?",
    "What does the diagram above show?",
    "Identify the part labelled Q.",
  ])("rejects active text questions that depend on hidden context: %s", (prompt) => {
    const result = validateQuestionBank(bankWith(prompt));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("questions[0] is active but depends on source context that the current question player does not display.");
  });

  it.each([
    "Which oceans are named in the chapter?",
    "As per the lesson, what is a strait?",
    "According to the textbook, which ocean is largest?",
  ])("rejects textbook-referential child prompts: %s", (prompt) => {
    const result = validateQuestionBank(bankWith(prompt));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("questions[0] uses textbook-referential wording; rewrite the prompt as a direct, self-contained question.");
  });

  it("requires a reason when hidden-context material is held for review", () => {
    const result = validateQuestionBank(bankWith("What does the picture below show?", { status: "review" }));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("questions[0] depends on source context and must record reviewReason while it is disabled or under review.");
  });

  it("allows a source group only when its cited region has a runtime asset", () => {
    const sourceGroup = bankWith("Study the displayed source and answer the questions.", {
      type: "source_group",
      sourceRefs: [{ pageId: "page-1", regionId: "case-study", supports: ["prompt", "answer", "rubric"] }],
      response: { subquestions: [{ id: "part-a", prompt: "What is shown?" }] }, answer: { subanswers: [{ id: "part-a", accepted: ["A"] }] },
      rubric: { subrubrics: [{ id: "part-a", points: [{ concept: "Identifies A", weight: 1 }] }] },
    });
    expect(validateQuestionBank(sourceGroup).valid).toBe(true);
  });
});
