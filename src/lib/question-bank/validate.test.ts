import { describe, expect, it } from "vitest";

import earlyVedicBank from "../../../samples/early-vedic-question-bank.json";
import { validateQuestionBank } from "./validate";

describe("validateQuestionBank", () => {
  it("accepts the reviewed Early Vedic bank", () => {
    const result = validateQuestionBank(earlyVedicBank);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.preview).toMatchObject({ questionCount: 40, sourceCount: 9, topicCount: 9 });
  });

  it("rejects a rubric whose attainable score differs from the marks", () => {
    const bank = structuredClone(earlyVedicBank);
    bank.questions[3].marks = 3;

    const result = validateQuestionBank(bank);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("questions[3].marks is 3, but its rubric can award 2.");
  });

  it("requires scored claims to cite rubric support", () => {
    const bank = structuredClone(earlyVedicBank);
    bank.questions[0].sourceRefs[0].supports = ["prompt", "answer"];

    const result = validateQuestionBank(bank);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("questions[0] has no source reference supporting its rubric.");
  });
});
