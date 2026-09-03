import { describe, expect, it } from "vitest";

import earlyVedicBank from "../../../samples/early-vedic-question-bank.json";
import { validateQuestionBank } from "./validate";

describe("validateQuestionBank", () => {
  it("accepts the reviewed Early Vedic bank", () => {
    const result = validateQuestionBank(earlyVedicBank);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.preview).toMatchObject({ questionCount: 79, sourceCount: 9, topicCount: 10 });
    expect(earlyVedicBank.bank.version).toBe(3);
    expect(earlyVedicBank.questions.find(({ id }) => id === "q-001")?.version).toBe(2);
    expect(earlyVedicBank.questions.find(({ id }) => id === "q-041")?.version).toBe(1);
  });

  it("accepts question origin and selection priority metadata", () => {
    const bank = structuredClone(earlyVedicBank);
    const question = bank.questions[0] as unknown as Record<string, unknown>;
    question.origin = "end_exercise";
    question.selectionPriority = 1;

    expect(validateQuestionBank(bank).valid).toBe(true);
  });

  it("rejects a rubric whose attainable score differs from the marks", () => {
    const bank = structuredClone(earlyVedicBank);
    const questionIndex = bank.questions.findIndex(({ id }) => id === "q-024");
    expect(questionIndex).toBeGreaterThanOrEqual(0);
    bank.questions[questionIndex].marks = 3;

    const result = validateQuestionBank(bank);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`questions[${questionIndex}].marks is 3, but its rubric can award 2.`);
  });

  it("requires scored claims to cite rubric support", () => {
    const bank = structuredClone(earlyVedicBank);
    const questionIndex = bank.questions.findIndex(({ id }) => id === "q-040");
    expect(questionIndex).toBeGreaterThanOrEqual(0);
    bank.questions[questionIndex].sourceRefs[0].supports = ["prompt", "answer"];

    const result = validateQuestionBank(bank);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`questions[${questionIndex}] has no source reference supporting its rubric.`);
  });
});
