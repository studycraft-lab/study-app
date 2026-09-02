type ObjectiveQuestion = {
  type?: unknown;
  answer?: unknown;
  marks?: unknown;
};

export type ScoreResult = {
  correct: boolean;
  earnedMarks: number;
  expectedAnswer: string;
};

const STOP_WORDS = new Set(["a", "an", "and", "of", "the", "was", "were", "is", "are"]);

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function compact(value: unknown): string {
  return normalize(value).replace(/\s+/g, "");
}

function containsAcceptedAnswer(response: unknown, accepted: unknown): boolean {
  const responseTokens = normalize(response).split(" ").filter(Boolean);
  const acceptedTokens = normalize(accepted).split(" ").filter(Boolean);
  if (!responseTokens.length || !acceptedTokens.length) return false;
  if (acceptedTokens.length === 1) {
    const token = acceptedTokens[0];
    return (!STOP_WORDS.has(token) || /^\d+$/u.test(token)) && responseTokens.includes(token);
  }
  return responseTokens.some((_, index) => acceptedTokens.every((token, offset) => responseTokens[index + offset] === token));
}

function sameSet(left: unknown, right: unknown): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const a = [...new Set(left.map(normalize))].sort();
  const b = [...new Set(right.map(normalize))].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function correctionMatches(actual: unknown, expected: unknown): boolean {
  const actualTokens = new Set(normalize(actual).split(" ").filter((token) => token && !STOP_WORDS.has(token)));
  const expectedTokens = normalize(expected).split(" ").filter((token) => token && !STOP_WORDS.has(token));
  if (!actualTokens.size || !expectedTokens.length) return false;
  return expectedTokens.filter((token) => actualTokens.has(token)).length / expectedTokens.length >= 0.5;
}

export function scoreObjective(question: ObjectiveQuestion, response: unknown): ScoreResult {
  const answer = record(question.answer);
  const marks = typeof question.marks === "number" ? question.marks : 0;
  let correct = false;
  let earnedMarks = 0;
  let expectedAnswer = "";

  switch (question.type) {
    case "single_choice":
      expectedAnswer = String(answer.correctOptionId ?? "");
      correct = normalize(response) === normalize(answer.correctOptionId);
      break;
    case "multiple_select":
      expectedAnswer = Array.isArray(answer.correctOptionIds) ? answer.correctOptionIds.join(", ") : "";
      correct = sameSet(response, answer.correctOptionIds);
      break;
    case "fill_blank":
    case "one_word": {
      const accepted = Array.isArray(answer.accepted) ? answer.accepted : [];
      expectedAnswer = accepted.map(String).join(" / ");
      correct = accepted.some((value) => normalize(value) === normalize(response) || compact(value) === compact(response) || containsAcceptedAnswer(response, value));
      break;
    }
    case "true_false_correct": {
      const given = record(response);
      expectedAnswer = answer.value === false ? `False — ${String(answer.correction ?? "")}` : "True";
      const truthChoiceCorrect = given.value === answer.value;
      correct = truthChoiceCorrect && (answer.value === true || correctionMatches(given.correction, answer.correction));
      if (truthChoiceCorrect && !correct) earnedMarks = marks / 2;
      break;
    }
    case "matching": {
      const given = record(response);
      const pairs = Array.isArray(answer.pairs) ? answer.pairs.map(record) : [];
      expectedAnswer = pairs.map((pair) => `${String(pair.leftId)} → ${String(pair.rightId)}`).join("; ");
      correct = pairs.length > 0 && pairs.every((pair) => normalize(given[String(pair.leftId)]) === normalize(pair.rightId));
      break;
    }
  }

  return { correct, earnedMarks: correct ? marks : earnedMarks, expectedAnswer };
}
