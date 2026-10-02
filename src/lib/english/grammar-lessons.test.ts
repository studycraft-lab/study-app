import { describe, expect, it } from "vitest";
import prepositions from "@/content/english/prepositions.json";
import conjunctions from "@/content/english/conjunctions.json";
import { gradeGrammarBatch, normalizeGrammarAnswer, publicGrammarQuestion, validateGrammarBatch } from "./grammar-lessons";

describe("English grammar lesson banks", () => {
  it("keeps 40 questions per lesson in five-question batches with source questions in order", () => {
    expect(prepositions.questions).toHaveLength(40);
    expect(conjunctions.questions).toHaveLength(40);
    expect(prepositions.questions.slice(0, 20).every((question) => question.origin === "worksheet")).toBe(true);
    expect(prepositions.questions.slice(20, 30).every((question) => question.origin === "past_paper")).toBe(true);
    expect(conjunctions.questions.slice(0, 10).every((question) => question.origin === "worksheet")).toBe(true);
    expect(prepositions.questions[20].prompt).toBe("(a) The book is lying __________ the table.");
    expect(conjunctions.questions[6].prompt).toBe("The athlete crossed the finish line. The crowd began cheering immediately.");
  });
  it("hides answers and explanations from question payloads", () => {
    const question = publicGrammarQuestion(prepositions.questions[0]);
    expect(question).not.toHaveProperty("answer");
    expect(question).not.toHaveProperty("explanation");
    expect(question.prompt).toBe("The children are playing ___ the garden.");
  });
  it("normalizes case, spaces and end punctuation", () => {
    expect(normalizeGrammarAnswer("  In. ")).toBe("in");
    expect(normalizeGrammarAnswer("  Although  she came,  he left. ")).toBe("although she came, he left");
  });
  it("grades preposition alternatives without calling a model", async () => {
    const results = await gradeGrammarBatch("prepositions", 0, [" IN ", "on", "at", "in", "onto"]);
    expect(results.map((result) => result.status)).toEqual(["correct", "correct", "correct", "correct", "correct"]);
    expect((await gradeGrammarBatch("prepositions", 0, ["", "under", "at", "in", "off"]))[4].status).toBe("review");
  });
  it("grades model joins and rejects forbidden connectors", async () => {
    const answers = conjunctions.questions.slice(0, 5).map((question) => question.answer);
    expect((await gradeGrammarBatch("conjunctions", 0, answers)).every((result) => result.status === "correct")).toBe(true);
    answers[0] = "The road was slippery but the driver controlled the car.";
    expect((await gradeGrammarBatch("conjunctions", 0, answers))[0].status).toBe("incorrect");
  });
  it("rejects malformed batches", () => {
    expect(() => validateGrammarBatch("prepositions", 8, Array(5).fill("in"))).toThrow();
    expect(() => validateGrammarBatch("prepositions", 0, Array(4).fill("in"))).toThrow();
  });
});
