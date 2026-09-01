import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { gradeSubmittedQuestion } from "./grading";

const bank = {
  sources: [{ id: "page-47", pageNumber: 47 }],
  questions: [{
    id: "q-006", type: "multi_point", prompt: "Why was the rajan not absolute?", marks: 2,
    answer: { ideal: "The sabha and samiti controlled and advised the rajan." },
    rubric: { spellingAffectsScore: false, grammarAffectsScore: false, uncertainBelowConfidence: 0.7, points: [
      { id: "p1", concept: "sabha and samiti controlled the rajan", weight: 0.5 },
      { id: "p2", concept: "samiti allowed tribal opinions", weight: 0.5 },
      { id: "p3", concept: "sabha advised the rajan", weight: 1 },
    ] },
    sourceRefs: [{ pageId: "page-47" }], explanation: "The councils limited royal power.",
  }],
};

describe("gradeSubmittedQuestion", () => {
  it("uses AI as a fallback for a semantically correct fill-in answer", async () => {
    const fillBank = {
      sources: [{ id: "page-46", pageNumber: 46 }],
      questions: [{
        id: "vedas", type: "fill_blank", prompt: "The four Vedas are ____.", marks: 1,
        answer: { accepted: ["Rig Veda, Atharva Veda, Sama Veda and Yajur Veda"] },
        sourceRefs: [{ pageId: "page-46" }],
      }],
    };
    const classifier = vi.fn(async () => ({
      points: [{ id: "answer", coverage: "covered" as const, confidence: 0.98 }],
      feedback: "All four Vedas are present; their order does not matter.", confidence: 0.98, spellingErrors: [], grammarErrors: [],
      meta: { provider: "openrouter" as const, model: "test", promptTokens: 10, completionTokens: 5, totalTokens: 15, cost: 0.001, latencyMs: 20 },
    }));
    await expect(gradeSubmittedQuestion(fillBank, "vedas", "Rig Veda, Sama Veda, Yajur Veda and Atharva Veda", classifier)).resolves.toMatchObject({
      correct: true, earnedMarks: 1, explanation: "All four Vedas are present; their order does not matter.", sourcePages: [46],
    });
    expect(classifier).toHaveBeenCalledOnce();
  });

  it("keeps obvious fill-in answers deterministic and free", async () => {
    const fillBank = { questions: [{ id: "place", type: "fill_blank", prompt: "Seven rivers", marks: 1, answer: { accepted: ["Sapta Sindhu"] } }] };
    const classifier = vi.fn();
    await expect(gradeSubmittedQuestion(fillBank, "place", "Saptasindhu", classifier)).resolves.toMatchObject({ correct: true, earnedMarks: 1 });
    expect(classifier).not.toHaveBeenCalled();
  });

  it("uses AI to judge a non-empty correction after the false choice is correct", async () => {
    const correctionBank = { questions: [{ id: "dress", type: "true_false_correct", prompt: "Aryans wore three garments.", marks: 2, answer: { value: false, correction: "The Aryans wore two garments." } }] };
    const classifier = vi.fn(async () => ({
      points: [{ id: "answer", coverage: "covered" as const, confidence: 0.96 }], feedback: "The false detail was corrected.", confidence: 0.96, spellingErrors: [], grammarErrors: [],
      meta: { provider: "openrouter" as const, model: "test", promptTokens: 8, completionTokens: 4, totalTokens: 12, cost: 0.001, latencyMs: 15 },
    }));
    await expect(gradeSubmittedQuestion(correctionBank, "dress", { value: false, correction: "The Aryans wore two garments." }, classifier)).resolves.toMatchObject({ correct: true, earnedMarks: 2 });
    expect(classifier).toHaveBeenCalledOnce();
  });

  it("calculates weighted marks in application code", async () => {
    const classifier = vi.fn(async () => ({
      points: [{ id: "p1", coverage: "covered" as const, confidence: 0.95 }, { id: "p2", coverage: "partial" as const, confidence: 0.9 }, { id: "p3", coverage: "missing" as const, confidence: 0.9 }],
      feedback: "Add what the sabha did.", confidence: 0.9, spellingErrors: [], grammarErrors: [],
      meta: { provider: "openrouter" as const, model: "test", promptTokens: 10, completionTokens: 5, totalTokens: 15, cost: 0.001, latencyMs: 20 },
    }));
    const result = await gradeSubmittedQuestion(bank, "q-006", "The councils controlled him and people had some say.", classifier);
    expect(result).toMatchObject({ earnedMarks: 0.75, correct: false, verdict: "partial", coveredPoints: ["sabha and samiti controlled the rajan"], partialPoints: ["samiti allowed tribal opinions"], missingPoints: ["sabha advised the rajan"], sourcePages: [47] });
  });

  it("flags exceptional low confidence for parent review", async () => {
    const classifier = vi.fn(async () => ({
      points: [{ id: "p1", coverage: "partial" as const, confidence: 0.5 }, { id: "p2", coverage: "missing" as const, confidence: 0.5 }, { id: "p3", coverage: "missing" as const, confidence: 0.5 }],
      feedback: "This needs review.", confidence: 0.55, spellingErrors: [], grammarErrors: [],
      meta: { provider: "openrouter" as const, model: "test", promptTokens: 10, completionTokens: 5, totalTokens: 15, cost: 0.001, latencyMs: 20 },
    }));
    await expect(gradeSubmittedQuestion(bank, "q-006", "Maybe the king listened.", classifier)).resolves.toMatchObject({ reviewRequired: true, verdict: "review" });
  });

  it("applies language penalties only when the rubric enables them", async () => {
    const spellingBank = structuredClone(bank);
    spellingBank.questions[0].rubric.spellingAffectsScore = true;
    const classifier = vi.fn(async () => ({
      points: [{ id: "p1", coverage: "covered" as const, confidence: 0.95 }, { id: "p2", coverage: "covered" as const, confidence: 0.95 }, { id: "p3", coverage: "covered" as const, confidence: 0.95 }],
      feedback: "One key term is misspelled.", confidence: 0.95, spellingErrors: ["samiti"], grammarErrors: ["fragment"],
      meta: { provider: "openrouter" as const, model: "test", promptTokens: 10, completionTokens: 5, totalTokens: 15, cost: 0.001, latencyMs: 20 },
    }));
    const result = await gradeSubmittedQuestion(spellingBank, "q-006", "Answer", classifier);
    expect(result).toMatchObject({ earnedMarks: 1.5, languageFeedback: { spellingPenalty: 0.5, grammarPenalty: 0 } });
  });
});
