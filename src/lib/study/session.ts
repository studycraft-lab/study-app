import { scoreObjective } from "./score-objective";

const TYPE_ORDER = ["single_choice", "multiple_select", "fill_blank", "true_false_correct", "matching"] as const;
const TYPE_SET = new Set<string>(TYPE_ORDER);

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordValue : {};
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export type StudyQuestion = {
  id: string;
  type: string;
  prompt: string;
  marks: number;
  response: RecordValue;
};

export function selectableQuestionIds(bankValue: unknown): string[] {
  const bank = record(bankValue);
  return records(bank.questions)
    .filter((question) => typeof question.id === "string" && TYPE_SET.has(String(question.type)) && question.status !== "disabled")
    .map((question) => String(question.id));
}

export function prepareSession(bankValue: unknown): StudyQuestion[] {
  const bank = record(bankValue);
  const candidates = records(bank.questions).filter((question) =>
    typeof question.id === "string" && typeof question.type === "string" &&
    TYPE_SET.has(question.type) && question.status !== "disabled",
  );
  const chosen: RecordValue[] = [];
  for (const type of TYPE_ORDER) {
    const match = candidates.find((question) => question.type === type && !chosen.includes(question));
    if (match) chosen.push(match);
  }
  for (const question of candidates) {
    if (chosen.length >= 5) break;
    if (!chosen.includes(question)) chosen.push(question);
  }
  return chosen.slice(0, 5).map((question) => ({
    id: String(question.id),
    type: String(question.type),
    prompt: String(question.prompt ?? ""),
    marks: typeof question.marks === "number" ? question.marks : 0,
    response: record(question.response),
  }));
}

export function prepareReviewSession(bankValue: unknown, questionIds: string[]): StudyQuestion[] {
  const bank = record(bankValue);
  const byId = new Map(records(bank.questions).map((question) => [String(question.id), question]));
  return questionIds
    .map((id) => byId.get(id))
    .filter((question): question is RecordValue => question !== undefined)
    .filter((question) => TYPE_SET.has(String(question.type)) && question.status !== "disabled")
    .map((question) => ({
      id: String(question.id),
      type: String(question.type),
      prompt: String(question.prompt ?? ""),
      marks: typeof question.marks === "number" ? question.marks : 0,
      response: record(question.response),
    }));
}

function optionText(question: RecordValue, id: unknown): string {
  const option = records(record(question.response).options).find((candidate) => candidate.id === id);
  return option ? String(option.text ?? id) : String(id ?? "");
}

function readableExpected(question: RecordValue, fallback: string): string {
  const answer = record(question.answer);
  if (question.type === "single_choice") return optionText(question, answer.correctOptionId);
  if (question.type === "multiple_select") return (Array.isArray(answer.correctOptionIds) ? answer.correctOptionIds : []).map((id) => optionText(question, id)).join(", ");
  if (question.type === "fill_blank") return (Array.isArray(answer.accepted) ? answer.accepted : []).map(String).join(" / ");
  if (question.type === "true_false_correct") return answer.value === false ? `False — ${String(answer.correction ?? "")}` : "True";
  if (question.type === "matching") {
    const response = record(question.response);
    const left = records(response.left);
    const right = records(response.right);
    return records(answer.pairs).map((pair) => {
      const leftText = left.find((item) => item.id === pair.leftId)?.text ?? pair.leftId;
      const rightText = right.find((item) => item.id === pair.rightId)?.text ?? pair.rightId;
      return `${String(leftText)} → ${String(rightText)}`;
    }).join("; ");
  }
  return fallback;
}

export function gradeQuestion(bankValue: unknown, questionId: string, response: unknown) {
  const bank = record(bankValue);
  const question = records(bank.questions).find((candidate) => candidate.id === questionId);
  if (!question || !TYPE_SET.has(String(question.type))) throw new Error("Question is unavailable.");
  const score = scoreObjective(question, response);
  const sourceIds = new Set(records(question.sourceRefs).map((ref) => ref.pageId));
  const sourcePages = records(bank.sources)
    .filter((source) => sourceIds.has(source.id))
    .map((source) => Number(source.pageNumber))
    .filter(Number.isFinite);
  return {
    ...score,
    expectedAnswer: readableExpected(question, score.expectedAnswer),
    explanation: String(question.explanation ?? (score.correct ? "That matches the textbook." : "Compare your answer with the expected answer.")),
    sourcePages,
  };
}
