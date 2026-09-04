import { describe, expect, it } from "vitest";

import earlyVedicBank from "../../../samples/early-vedic-question-bank.json";
import { validateQuestionBank } from "./validate";

describe("validateQuestionBank", () => {
  it("accepts the reviewed Early Vedic bank", () => {
    const result = validateQuestionBank(earlyVedicBank);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.preview).toMatchObject({ questionCount: 79, sourceCount: 9, topicCount: 10 });
    expect(earlyVedicBank.bank.version).toBe(4);
    expect(earlyVedicBank.questions.find(({ id }) => id === "q-001")?.version).toBe(2);
    expect(earlyVedicBank.questions.find(({ id }) => id === "q-016")?.version).toBe(3);
    expect(earlyVedicBank.questions.find(({ id }) => id === "q-018")?.version).toBe(3);
    expect(earlyVedicBank.questions.find(({ id }) => id === "q-041")?.version).toBe(1);
  });

  it("accepts question origin and selection priority metadata", () => {
    const bank = structuredClone(earlyVedicBank);
    const question = bank.questions[0] as unknown as Record<string, unknown>;
    question.origin = "end_exercise";
    question.selectionPriority = 1;

    expect(validateQuestionBank(bank).valid).toBe(true);
  });

  it("accepts grounded alternative corrections for false statements", () => {
    const bank = structuredClone(earlyVedicBank) as unknown as { questions: Array<Record<string, unknown>> };
    const question = bank.questions.find(({ id }) => id === "q-018")!;
    question.answer = {
      value: false,
      correction: "The dress of the Aryans consisted of two garments.",
      acceptedCorrections: ["The Aryans wore two garments."],
    };

    expect(validateQuestionBank(bank).valid).toBe(true);
  });

  it("rejects missing, contradictory, and duplicate correction metadata", () => {
    const missing = structuredClone(earlyVedicBank) as unknown as { questions: Array<Record<string, unknown>> };
    const falseQuestion = missing.questions.find(({ id }) => id === "q-018")!;
    falseQuestion.answer = { value: false };
    expect(validateQuestionBank(missing).errors.some((error) => /is false but has no correction/.test(error))).toBe(true);

    const trueBank = structuredClone(earlyVedicBank) as unknown as { questions: Array<Record<string, unknown>> };
    const trueQuestion = trueBank.questions.find(({ id }) => id === "q-017")!;
    trueQuestion.answer = { value: true, correction: "Unused correction." };
    expect(validateQuestionBank(trueBank).errors.some((error) => /is true but defines false-statement corrections/.test(error))).toBe(true);

    const duplicateBank = structuredClone(earlyVedicBank) as unknown as { questions: Array<Record<string, unknown>> };
    const duplicateQuestion = duplicateBank.questions.find(({ id }) => id === "q-018")!;
    duplicateQuestion.answer = {
      value: false,
      correction: "The Aryans wore two garments.",
      acceptedCorrections: ["The Aryans wore two garments!"],
    };
    expect(validateQuestionBank(duplicateBank).errors.some((error) => /duplicate accepted corrections/.test(error))).toBe(true);
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
