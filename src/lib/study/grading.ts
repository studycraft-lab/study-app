import "server-only";

import { classifyRubric, type RubricClassificationInput } from "@/lib/ai/openrouter";
import { gradeQuestion } from "./session";

type RecordValue = Record<string, unknown>;
type Classifier = (input: RubricClassificationInput) => ReturnType<typeof classifyRubric>;

const SUBJECTIVE_TYPES = new Set(["brief_answer", "multi_point", "compare"]);
const FUZZY_FALLBACK_TYPES = new Set(["fill_blank", "one_word"]);

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordValue : {};
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function withObjectiveVerdict<T extends { correct: boolean; earnedMarks: number }>(result: T) {
  return {
    ...result,
    verdict: result.correct ? "correct" : result.earnedMarks > 0 ? "partial" : "incorrect",
    reviewRequired: false,
  };
}

function feedbackClaimsCorrect(feedback: string): boolean {
  return /\b(great job|correctly identified|answer is correct|fully correct|correct answer)\b/iu.test(feedback);
}

export async function gradeSubmittedQuestion(bankValue: unknown, questionId: string, response: unknown, classifier: Classifier = classifyRubric) {
  const bank = record(bankValue);
  const question = records(bank.questions).find((candidate) => candidate.id === questionId);
  if (!question) throw new Error("Question is unavailable.");
  const type = String(question.type);
  if (!SUBJECTIVE_TYPES.has(type)) {
    const objective = gradeQuestion(bankValue, questionId, response);
    if (!FUZZY_FALLBACK_TYPES.has(type)) return withObjectiveVerdict(objective);
    const answer = record(question.answer);
    const childAnswer = String(response ?? "").trim();
    if (objective.correct || !childAnswer) return withObjectiveVerdict(objective);
    const expected = Array.isArray(answer.accepted) ? answer.accepted.map(String).join(" / ") : objective.expectedAnswer;
    const classification = await classifier({
      question: String(question.prompt ?? ""),
      childAnswer,
      groundedEvidence: JSON.stringify({
        acceptedAnswer: expected,
        gradingPolicy: "Accept a semantically equivalent answer. Allow different word order, punctuation, phrasing, and minor spelling variation, but require every essential fact and reject contradictions or extra incorrect facts.",
        textbookPages: objective.sourcePages,
      }),
      points: [{ id: "answer", concept: `The answer is semantically equivalent to: ${expected}` }],
      checkSpelling: false,
      checkGrammar: false,
    });
    const judgement = classification.points.find((point) => point.id === "answer")!;
    const correct = judgement.coverage === "covered";
    const earnedMarks = correct ? Number(question.marks ?? 0) : objective.earnedMarks;
    const contradictoryFeedback = !correct && feedbackClaimsCorrect(classification.feedback);
    const reviewRequired = classification.confidence < 0.7 || contradictoryFeedback;
    return {
      ...objective,
      correct,
      earnedMarks,
      explanation: contradictoryFeedback
        ? "The automated score and explanation disagreed, so this answer needs parent review."
        : classification.feedback,
      verdict: reviewRequired ? "review" : correct ? "correct" : earnedMarks > 0 ? "partial" : "incorrect",
      reviewRequired,
      confidence: classification.confidence,
      gradingMeta: classification.meta,
    };
  }
  const childAnswer = String(response ?? "").trim();
  if (!childAnswer) throw new Error("Write an answer before submitting.");
  const rubric = record(question.rubric);
  const points = records(rubric.points).map((point, index) => ({
    id: typeof point.id === "string" ? point.id : `p${index + 1}`,
    concept: String(point.concept ?? ""),
    weight: typeof point.weight === "number" ? point.weight : 0.5,
  }));
  if (!points.length) throw new Error("This question needs a scoring rubric.");
  const answer = record(question.answer);
  const sourceIds = new Set(records(question.sourceRefs).map((ref) => ref.pageId));
  const sourcePages = records(bank.sources).filter((source) => sourceIds.has(source.id)).map((source) => Number(source.pageNumber)).filter(Number.isFinite);
  const classification = await classifier({
    question: String(question.prompt ?? ""),
    childAnswer,
    groundedEvidence: JSON.stringify({ answer, rubricPoints: points.map(({ id, concept }) => ({ id, concept })), explanation: question.explanation ?? "", textbookPages: sourcePages }),
    points: points.map(({ id, concept }) => ({ id, concept })),
    checkSpelling: rubric.spellingAffectsScore === true,
    checkGrammar: rubric.grammarAffectsScore === true,
  });
  const judgementById = new Map(classification.points.map((point) => [point.id, point]));
  const awarded = points.map((point) => {
    const judgement = judgementById.get(point.id)!;
    const marks = judgement.coverage === "covered" ? point.weight : judgement.coverage === "partial" ? point.weight / 2 : 0;
    return { ...point, ...judgement, marks: rounded(marks) };
  });
  const maximum = typeof question.marks === "number" ? question.marks : points.reduce((sum, point) => sum + point.weight, 0);
  const contentMarks = Math.min(maximum, awarded.reduce((sum, point) => sum + point.marks, 0));
  const spellingPenalty = rubric.spellingAffectsScore === true && classification.spellingErrors.length ? 0.5 : 0;
  const grammarPenalty = rubric.grammarAffectsScore === true && classification.grammarErrors.length ? 0.5 : 0;
  const earnedMarks = rounded(Math.max(0, contentMarks - spellingPenalty - grammarPenalty));
  const threshold = typeof rubric.uncertainBelowConfidence === "number" ? rubric.uncertainBelowConfidence : 0.7;
  const reviewRequired = classification.confidence < threshold;
  const correct = earnedMarks >= maximum;
  const verdict = reviewRequired ? "review" : correct ? "correct" : earnedMarks > 0 ? "partial" : "incorrect";
  return {
    correct,
    earnedMarks,
    expectedAnswer: String(answer.ideal ?? "See the required textbook points below."),
    explanation: classification.feedback,
    sourcePages,
    verdict,
    reviewRequired,
    confidence: classification.confidence,
    coveredPoints: awarded.filter((point) => point.coverage === "covered").map((point) => point.concept),
    partialPoints: awarded.filter((point) => point.coverage === "partial").map((point) => point.concept),
    missingPoints: awarded.filter((point) => point.coverage === "missing").map((point) => point.concept),
    languageFeedback: { spellingErrors: classification.spellingErrors, grammarErrors: classification.grammarErrors, spellingPenalty, grammarPenalty },
    gradingMeta: classification.meta,
  };
}
