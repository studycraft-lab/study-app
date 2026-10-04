import { describe, expect, it } from "vitest";
import prepositions from "@/content/english/prepositions.json";
import conjunctions from "@/content/english/conjunctions.json";
import tenses from "@/content/english/tenses.json";
import pronouns from "@/content/english/pronouns.json";
import adjectives from "@/content/english/adjectives.json";
import { gradeGrammarBatch, normalizeGrammarAnswer, publicGrammarQuestion, usesRequiredConnector, validateGrammarBatch } from "./grammar-lessons";

describe("English grammar lesson banks", () => {
  it("keeps source questions in order and four new conjunction batches", () => {
    expect(prepositions.questions).toHaveLength(40);
    expect(conjunctions.questions).toHaveLength(60);
    expect(conjunctions.questions.slice(40).every((question) => question.kind === "join" && "requiredConnector" in question)).toBe(true);
    expect(tenses.questions).toHaveLength(40);
    expect(pronouns.questions).toHaveLength(40);
    expect(adjectives.questions).toHaveLength(40);
    expect(prepositions.questions.slice(0, 20).every((question) => question.origin === "worksheet")).toBe(true);
    expect(prepositions.questions.slice(20, 30).every((question) => question.origin === "past_paper")).toBe(true);
    expect(conjunctions.questions.slice(0, 10).every((question) => question.origin === "worksheet")).toBe(true);
    expect(tenses.questions.slice(0, 9).every((question) => question.origin === "worksheet")).toBe(true);
    expect(tenses.questions.slice(9, 29).every((question) => question.origin === "past_paper")).toBe(true);
    expect(pronouns.questions.slice(0, 10).every((question) => question.origin === "worksheet")).toBe(true);
    expect(pronouns.questions.slice(10, 17).every((question) => question.origin === "past_paper")).toBe(true);
    expect(adjectives.questions.slice(0, 9).every((question) => question.origin === "worksheet")).toBe(true);
    expect(adjectives.questions.slice(9, 22).every((question) => question.origin === "past_paper")).toBe(true);
    expect(prepositions.questions[20].prompt).toBe("(a) The book is lying __________ the table.");
    expect(conjunctions.questions[6].prompt).toBe("The athlete crossed the finish line. The crowd began cheering immediately.");
    expect(tenses.questions[0].prompt).toBe("1.The children are decorating the classroom for the competition.(Simple Past)");
    expect(pronouns.questions[9].prompt).toBe("The girl who's bag was left in the classroom came back to collect it.");
    expect(adjectives.questions[0].prompt).toBe("The blue whale is _____ than the elephant. (large)");
    expect(adjectives.questions[12].prompt).toBe("(a) The soldiers fought to protect their country.");
  });
  it("hides answers and explanations from question payloads", () => {
    const question = publicGrammarQuestion(prepositions.questions[0]);
    expect(question).not.toHaveProperty("answer");
    expect(question).not.toHaveProperty("explanation");
    expect(question.prompt).toBe("The children are playing ___ the garden.");
    expect(publicGrammarQuestion(tenses.questions[0]).starter).toBe("The children are decorating the classroom for the competition.");
  });
  it("keeps each tense rewrite starter free of question numbers and tense instructions", () => {
    for (const question of tenses.questions.filter((item) => item.kind === "rewrite")) {
      expect(question.starter).toMatch(/\.$/u);
      expect(question.starter).not.toMatch(/^\d+\.|\([^()]+\)$/u);
      expect(question.prompt).toContain(question.starter);
    }
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
    answers[0] = conjunctions.questions[0].prompt;
    const unchanged = (await gradeGrammarBatch("conjunctions", 0, answers))[0];
    expect(unchanged.status).toBe("incorrect");
    expect(unchanged.explanation).toContain("original sentence");
  });
  it("uses the requested connector in the new conjunction batches", async () => {
    for (let batch = 8; batch < 12; batch++) {
      const questions = conjunctions.questions.slice(batch * 5, batch * 5 + 5);
      expect((await gradeGrammarBatch("conjunctions", batch, questions.map((question) => question.answer))).every((result) => result.status === "correct")).toBe(true);
      expect(questions.every((question) => "requiredConnector" in question && Boolean(question.requiredConnector) && usesRequiredConnector(question.answer, question.requiredConnector!))).toBe(true);
    }
    const answers = conjunctions.questions.slice(40, 45).map((question) => question.answer);
    answers[0] = "Mira revised the chapter and explained it to her friends.";
    const result = (await gradeGrammarBatch("conjunctions", 8, answers))[0];
    expect(result.status).toBe("incorrect");
    expect(result.explanation).toContain("not only ... but also");
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
  it("grades adjective comparisons, school categories and accepted category names", async () => {
    const first = adjectives.questions.slice(0, 5).map((question) => question.answer);
    first[4] = "pleasanter";
    expect((await gradeGrammarBatch("adjectives", 0, first)).every((result) => result.status === "correct")).toBe(true);
    const third = adjectives.questions.slice(10, 15).map((question) => question.answer);
    third[2] = "possessive adjective: their";
    expect((await gradeGrammarBatch("adjectives", 2, third))[2].status).toBe("correct");
    expect((await gradeGrammarBatch("adjectives", 2, third))[0].expectedAnswer).toContain("Number");
    const last = adjectives.questions.slice(35, 40).map((question) => question.answer);
    last[2] = "MORE CLEAR";
    expect((await gradeGrammarBatch("adjectives", 7, last))[2].status).toBe("correct");
  });
  it("rejects malformed batches", () => {
    expect(() => validateGrammarBatch("prepositions", 8, Array(5).fill("in"))).toThrow();
    expect(() => validateGrammarBatch("prepositions", 0, Array(4).fill("in"))).toThrow();
  });
});
