import { describe, expect, it } from "vitest";
import prepositions from "@/content/english/prepositions.json";
import conjunctions from "@/content/english/conjunctions.json";
import tenses from "@/content/english/tenses.json";
import pronouns from "@/content/english/pronouns.json";
import { gradeGrammarBatch, normalizeGrammarAnswer, publicGrammarQuestion, validateGrammarBatch } from "./grammar-lessons";

describe("English grammar lesson banks", () => {
  it("keeps 40 questions per lesson in five-question batches with source questions in order", () => {
    expect(prepositions.questions).toHaveLength(40);
    expect(conjunctions.questions).toHaveLength(40);
    expect(tenses.questions).toHaveLength(40);
    expect(pronouns.questions).toHaveLength(40);
    expect(prepositions.questions.slice(0, 20).every((question) => question.origin === "worksheet")).toBe(true);
    expect(prepositions.questions.slice(20, 30).every((question) => question.origin === "past_paper")).toBe(true);
    expect(conjunctions.questions.slice(0, 10).every((question) => question.origin === "worksheet")).toBe(true);
    expect(tenses.questions.slice(0, 9).every((question) => question.origin === "worksheet")).toBe(true);
    expect(tenses.questions.slice(9, 29).every((question) => question.origin === "past_paper")).toBe(true);
    expect(pronouns.questions.slice(0, 10).every((question) => question.origin === "worksheet")).toBe(true);
    expect(pronouns.questions.slice(10, 17).every((question) => question.origin === "past_paper")).toBe(true);
    expect(prepositions.questions[20].prompt).toBe("(a) The book is lying __________ the table.");
    expect(conjunctions.questions[6].prompt).toBe("The athlete crossed the finish line. The crowd began cheering immediately.");
    expect(tenses.questions[0].prompt).toBe("1.The children are decorating the classroom for the competition.(Simple Past)");
    expect(pronouns.questions[9].prompt).toBe("The girl who's bag was left in the classroom came back to collect it.");
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
  it("grades whole-sentence pronoun corrections and pronoun kinds", async () => {
    const first = pronouns.questions.slice(0, 5).map((question) => question.answer);
    first[4] = "The boy that won the race received a medal.";
    expect((await gradeGrammarBatch("pronouns", 0, first)).every((result) => result.status === "correct")).toBe(true);
    first[0] = "her";
    expect((await gradeGrammarBatch("pronouns", 0, first))[0].status).toBe("incorrect");
    const third = pronouns.questions.slice(10, 15).map((question) => question.answer);
    third[2] = "relative pronoun: THAT";
    expect((await gradeGrammarBatch("pronouns", 2, third))[2].status).toBe("correct");
  });
  it("accepts source keys and valid alternatives in tense questions", async () => {
    const first = tenses.questions.slice(0, 5).map((question) => question.answer);
    first[1] = "The chef was preparing fresh bread every morning.";
    expect((await gradeGrammarBatch("tenses", 0, first)).every((result) => result.status === "correct")).toBe(true);
    const third = tenses.questions.slice(10, 15).map((question) => question.answer);
    third[3] = "b";
    expect((await gradeGrammarBatch("tenses", 2, third))[3].status).toBe("correct");
    expect(publicGrammarQuestion(tenses.questions[21]).context).toContain("Last weekend, I … (0)… (go)");
  });
  it("rejects malformed batches", () => {
    expect(() => validateGrammarBatch("prepositions", 8, Array(5).fill("in"))).toThrow();
    expect(() => validateGrammarBatch("prepositions", 0, Array(4).fill("in"))).toThrow();
  });
});
