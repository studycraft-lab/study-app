import { describe, expect, it } from "vitest";

import { gradeQuestion, prepareReviewSession, prepareSession, selectableQuestionIds } from "./session";

const bank = {
  sources: [{ id: "p1", pageNumber: 45, regions: [] }],
  questions: [
    { id: "fill", type: "fill_blank", status: "active", prompt: "Seven rivers: ___", marks: 1, response: { blankCount: 1 }, answer: { accepted: ["Sapta Sindhu"] }, sourceRefs: [{ pageId: "p1" }], explanation: "This was the first settlement region." },
    { id: "one", type: "single_choice", status: "active", prompt: "Choose", marks: 1, response: { options: [{ id: "a", text: "Early Vedic" }, { id: "b", text: "Later Vedic" }] }, answer: { correctOptionId: "a" }, sourceRefs: [{ pageId: "p1" }] },
    { id: "multi", type: "multiple_select", status: "active", prompt: "Choose all", marks: 2, response: { options: [{ id: "a", text: "Rig" }, { id: "b", text: "Sama" }] }, answer: { correctOptionIds: ["a", "b"] }, sourceRefs: [{ pageId: "p1" }] },
    { id: "tf", type: "true_false_correct", status: "active", prompt: "Three garments", marks: 2, response: { requiresCorrectionWhenFalse: true }, answer: { value: false, correction: "There were two garments." }, sourceRefs: [{ pageId: "p1" }] },
    { id: "match", type: "matching", status: "active", prompt: "Match", marks: 2, response: { left: [{ id: "jana", text: "Jana" }], right: [{ id: "tribe", text: "Tribe" }] }, answer: { pairs: [{ leftId: "jana", rightId: "tribe" }] }, sourceRefs: [{ pageId: "p1" }] },
    { id: "subjective", type: "brief_answer", status: "active", prompt: "Explain", marks: 2, answer: { ideal: "..." }, sourceRefs: [{ pageId: "p1" }] },
  ],
};

describe("study session DTO", () => {
  it("returns five supported questions without answers", () => {
    const questions = prepareSession(bank);
    expect(questions).toHaveLength(5);
    expect(questions.map((question) => question.type)).toEqual(["single_choice", "multiple_select", "fill_blank", "true_false_correct", "matching"]);
    expect(JSON.stringify(questions)).not.toContain("correctOptionId");
    expect(JSON.stringify(questions)).not.toContain("Sapta Sindhu");
  });

  it("returns readable feedback and the cited page only after grading", () => {
    const feedback = gradeQuestion(bank, "one", "b");
    expect(feedback).toMatchObject({ correct: false, expectedAnswer: "Early Vedic", sourcePages: [45] });
  });

  it("makes supported free-text questions available without exposing their rubrics", () => {
    expect(selectableQuestionIds(bank)).toContain("subjective");
    const question = prepareReviewSession(bank, ["subjective"], "seed")[0];
    expect(question).toMatchObject({ type: "brief_answer", response: {} });
    expect(JSON.stringify(question)).not.toContain("ideal");
  });

  it("varies option order between sessions and preserves it for the same session seed", () => {
    const optionBank = { questions: [{ id: "choice", type: "single_choice", status: "active", prompt: "Choose", marks: 1, response: { options: ["a", "b", "c", "d", "e"].map((id) => ({ id, text: id })) } }] };
    const first = prepareReviewSession(optionBank, ["choice"], "first-session")[0].response.options;
    const resumed = prepareReviewSession(optionBank, ["choice"], "first-session")[0].response.options;
    const next = prepareReviewSession(optionBank, ["choice"], "next-session")[0].response.options;
    expect(resumed).toEqual(first);
    expect(next).not.toEqual(first);
  });

  it("never presents matching choices in the same order as their corresponding rows", () => {
    const matchingBank = { questions: [{ id: "match", type: "matching", status: "active", prompt: "Match", marks: 4, response: {
      left: ["a", "b", "c", "d"].map((id) => ({ id, text: id })),
      right: ["1", "2", "3", "4"].map((id) => ({ id, text: id })),
    }, answer: { pairs: ["a", "b", "c", "d"].map((leftId, index) => ({ leftId, rightId: String(index + 1) })) } }] };
    for (let index = 0; index < 100; index += 1) {
      const right = prepareReviewSession(matchingBank, ["match"], `session-${index}`)[0].response.right as Array<{ id: string }>;
      expect(right.map((item) => item.id)).not.toEqual(["1", "2", "3", "4"]);
    }
  });
});
