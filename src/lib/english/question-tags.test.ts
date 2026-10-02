import { describe, expect, it } from "vitest";
import { QUESTION_TAGS_BATCH_COUNT, QUESTION_TAGS_LESSON, gradeQuestionTagBatch, normalizeQuestionTag, publicQuestion } from "./question-tags";

describe("Question Tags lesson", () => {
  it("has exactly eight complete batches and hides answers from public questions", () => {
    expect(QUESTION_TAGS_LESSON.questions).toHaveLength(40);
    expect(QUESTION_TAGS_BATCH_COUNT).toBe(8);
    expect(QUESTION_TAGS_LESSON.questions.map((question) => question.number)).toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
    for (const question of QUESTION_TAGS_LESSON.questions) {
      expect(publicQuestion(question)).not.toHaveProperty("answer");
      expect(publicQuestion(question)).not.toHaveProperty("accepted");
    }
  });

  it("accepts each authored answer in its batch", () => {
    for (let batchIndex = 0; batchIndex < QUESTION_TAGS_BATCH_COUNT; batchIndex++) {
      const answers = QUESTION_TAGS_LESSON.questions.slice(batchIndex * 5, batchIndex * 5 + 5).map((question) => question.answer);
      expect(gradeQuestionTagBatch(batchIndex, answers).every((result) => result.correct)).toBe(true);
    }
  });

  it("ignores case, extra space, question mark, and apostrophe style only", () => {
    expect(normalizeQuestionTag("  AREN’T   THEY ? ")).toBe("aren't they");
    const answers = [" AREN’T  THEY ? ", "have you", "can't he", "shall we", "did they"];
    expect(gradeQuestionTagBatch(0, answers).every((result) => result.correct)).toBe(true);
    expect(gradeQuestionTagBatch(0, ["are they", "have you", "can't he", "shall we", "did they"])[0].correct).toBe(false);
    expect(gradeQuestionTagBatch(0, ["aren't they or are they", "have you", "can't he", "shall we", "did they"])[0].correct).toBe(false);
  });

  it("checks choice IDs and rejects invalid batches", () => {
    expect(gradeQuestionTagBatch(6, ["b", "b", "c", "b", "b"]).every((result) => result.correct)).toBe(true);
    expect(gradeQuestionTagBatch(6, ["a", "b", "c", "b", "b"])[0].correct).toBe(false);
    expect(() => gradeQuestionTagBatch(8, Array(5).fill(""))).toThrow();
    expect(() => gradeQuestionTagBatch(0, ["aren't they"])).toThrow();
  });

  it("accepts explicitly approved request tags while keeping the worksheet key", () => {
    const answers = ["won't she", "were they", "does she", "could you", "didn't they"];
    expect(gradeQuestionTagBatch(1, answers)[3]).toMatchObject({ correct: true, expectedAnswer: "will you?" });
    expect(gradeQuestionTagBatch(1, ["won't she", "were they", "does she", "does you", "didn't they"])[3].correct).toBe(false);
  });
});
