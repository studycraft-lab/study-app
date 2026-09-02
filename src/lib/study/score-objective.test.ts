import { describe, expect, it } from "vitest";

import { scoreObjective } from "./score-objective";

describe("scoreObjective", () => {
  it("scores single and multiple choice without AI", () => {
    expect(scoreObjective({ type: "single_choice", answer: { correctOptionId: "early" }, marks: 1 }, "early").correct).toBe(true);
    expect(scoreObjective({ type: "multiple_select", answer: { correctOptionIds: ["rig", "sama"] }, marks: 2 }, ["sama", "rig"]).correct).toBe(true);
    expect(scoreObjective({ type: "multiple_select", answer: { correctOptionIds: ["rig", "sama"] }, marks: 2 }, ["rig"]).correct).toBe(false);
  });

  it("normalizes fill-in-the-blank spelling and whitespace", () => {
    const result = scoreObjective({ type: "fill_blank", answer: { accepted: ["Sapta Sindhu"] }, marks: 1 }, "  sapta sindhu ");
    expect(result).toMatchObject({ correct: true, earnedMarks: 1 });
  });

  it("accepts spacing and punctuation variants without AI", () => {
    expect(scoreObjective({ type: "fill_blank", answer: { accepted: ["Sapta Sindhu"] }, marks: 1 }, "Saptasindhu")).toMatchObject({ correct: true, earnedMarks: 1 });
    expect(scoreObjective({ type: "one_word", answer: { accepted: ["Indo-Aryans"] }, marks: 1 }, "indo aryans")).toMatchObject({ correct: true, earnedMarks: 1 });
  });

  it("accepts a fill-in answer when the expected value appears in a sentence", () => {
    expect(scoreObjective(
      { type: "fill_blank", answer: { accepted: ["four", "4"] }, marks: 1 },
      "A life cycle of a butterfly has 4 stages",
    )).toMatchObject({ correct: true, earnedMarks: 1 });
  });

  it("requires a false statement to be corrected", () => {
    const question = {
      type: "true_false_correct",
      answer: { value: false, correction: "The dress of the Aryans consisted of two garments." },
      marks: 2,
    };
    expect(scoreObjective(question, { value: false, correction: "" }).correct).toBe(false);
    expect(scoreObjective(question, { value: false, correction: "Aryans wore two garments." }).correct).toBe(true);
  });

  it("awards half marks when the truth choice is correct but its correction is missing", () => {
    const question = {
      type: "true_false_correct",
      answer: { value: false, correction: "The dress of the Aryans consisted of two garments." },
      marks: 2,
    };
    expect(scoreObjective(question, { value: false, correction: "" })).toMatchObject({
      correct: false,
      earnedMarks: 1,
    });
  });

  it("scores every matching pair", () => {
    const question = { type: "matching", answer: { pairs: [{ leftId: "jana", rightId: "tribe" }, { leftId: "gramani", rightId: "village" }] }, marks: 2 };
    expect(scoreObjective(question, { jana: "tribe", gramani: "village" }).correct).toBe(true);
    expect(scoreObjective(question, { jana: "village", gramani: "tribe" }).correct).toBe(false);
  });
});
