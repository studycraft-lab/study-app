import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import questionBankSchema from "../../../schemas/question-bank.schema.json";

export type BankMetadata = {
  board: string;
  grade: number;
  subject: string;
  bookTitle: string | null;
  chapterNumber: number | null;
  chapterTitle: string;
};

export type BankPreview = BankMetadata & {
  bankId: string;
  bankVersion: number;
  schemaVersion: string;
  questionCount: number;
  sourceCount: number;
  topicCount: number;
};

export type ValidatedQuestionBank = {
  bank: Record<string, unknown>;
  questions: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  topics: Array<Record<string, unknown>>;
  schemaVersion: string;
};

export type BankValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  preview: BankPreview | null;
  value: ValidatedQuestionBank | null;
};

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(questionBankSchema);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function schemaError(error: ErrorObject): string {
  const path = error.instancePath || "root";
  if (error.keyword === "additionalProperties") {
    return `${path} contains unsupported field ${String(error.params.additionalProperty)}.`;
  }
  return `${path} ${error.message ?? "does not match the question-bank schema"}.`;
}

function pointTotal(points: unknown): number | null {
  const values = records(points).map((point) => point.weight);
  if (values.length === 0 || values.some((weight) => typeof weight !== "number")) return null;
  return values.reduce<number>((sum, weight) => sum + Number(weight), 0);
}

function attainableMarks(question: Record<string, unknown>): number | null {
  const type = question.type;
  const answer = isRecord(question.answer) ? question.answer : {};
  const rubric = isRecord(question.rubric) ? question.rubric : {};

  if (type === "matching") {
    const pairCount = records(answer.pairs).length;
    return typeof rubric.pointsPerPair === "number" ? pairCount * rubric.pointsPerPair : null;
  }
  if (type === "source_group") {
    const totals = records(rubric.subrubrics).map((subrubric) => pointTotal(subrubric.points));
    return totals.length > 0 && totals.every((total): total is number => total !== null)
      ? totals.reduce((sum, total) => sum + total, 0)
      : null;
  }
  if (["true_false_correct", "brief_answer", "multi_point", "compare", "map_work"].includes(String(type))) {
    const total = pointTotal(rubric.points);
    if (total === null) return null;
    return typeof rubric.maximumPoints === "number" ? Math.min(total, rubric.maximumPoints) : total;
  }
  return typeof question.marks === "number" ? question.marks : null;
}

function duplicateIds(items: Array<Record<string, unknown>>, path: string, errors: string[]): Set<string> {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const id = String(item.id ?? "");
    if (seen.has(id)) errors.push(`Duplicate ${path} id ${id} at ${path}[${index}].`);
    seen.add(id);
  });
  return seen;
}

function optionIds(question: Record<string, unknown>): Set<string> {
  const response = isRecord(question.response) ? question.response : {};
  return new Set(records(response.options).map((option) => String(option.id)));
}

function normalizedPrompt(prompt: unknown): string {
  return String(prompt ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dependsOnUndisplayedContext(question: Record<string, unknown>): boolean {
  if (question.status !== "active" || ["source_group", "map_work"].includes(String(question.type))) return false;
  return /\b(?:case[- ]study|diagram|illustration|image|labelled|labeled)\b|\bshown\s+(?:in|above|below)\b/i.test(String(question.prompt ?? ""));
}

export function validateQuestionBank(input: unknown): BankValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!validateSchema(input)) errors.push(...(validateSchema.errors ?? []).map(schemaError));
  if (!isRecord(input)) return { valid: false, errors, warnings, preview: null, value: null };

  const bank = isRecord(input.bank) ? input.bank : null;
  const sources = records(input.sources);
  const topics = records(input.topics);
  const questions = records(input.questions);
  const sourceIds = duplicateIds(sources, "source", errors);
  const topicIds = duplicateIds(topics, "topic", errors);
  duplicateIds(questions, "question", errors);

  const sourceRegions = new Map<string, Set<string>>();
  sources.forEach((source) => {
    sourceRegions.set(String(source.id), new Set(records(source.regions).map((region) => String(region.id))));
    if (typeof source.extractionConfidence === "number" && source.extractionConfidence < 0.85) {
      warnings.push(`Source ${String(source.id)} has low extraction confidence.`);
    }
    if (source.reviewRequired === true) warnings.push(`Source ${String(source.id)} requires review.`);
  });

  const prompts = new Map<string, string>();
  questions.forEach((question, index) => {
    const path = `questions[${index}]`;
    const id = String(question.id ?? path);
    if (dependsOnUndisplayedContext(question)) {
      errors.push(`${path} is active but refers to visual or shared case-study context that the text player does not display.`);
    }
    strings(question.topicIds).forEach((topicId) => {
      if (!topicIds.has(topicId)) errors.push(`${path} cites missing topic ${topicId}.`);
    });

    const refs = records(question.sourceRefs);
    refs.forEach((ref) => {
      const pageId = String(ref.pageId ?? "");
      if (!sourceIds.has(pageId)) errors.push(`${path} cites missing source page ${pageId || "(blank)"}.`);
      if (typeof ref.regionId === "string" && !sourceRegions.get(pageId)?.has(ref.regionId)) {
        errors.push(`${path} cites missing region ${ref.regionId} on ${pageId}.`);
      }
    });
    const supported = new Set(refs.flatMap((ref) => strings(ref.supports)));
    for (const claim of ["prompt", "answer", "rubric"]) {
      if (!supported.has(claim)) errors.push(`${path} has no source reference supporting its ${claim}.`);
    }

    const attainable = attainableMarks(question);
    if (typeof question.marks === "number" && attainable !== null && Math.abs(question.marks - attainable) > 0.0001) {
      errors.push(`${path}.marks is ${question.marks}, but its rubric can award ${attainable}.`);
    }

    const options = optionIds(question);
    const answer = isRecord(question.answer) ? question.answer : {};
    if (question.type === "single_choice" && !options.has(String(answer.correctOptionId))) {
      errors.push(`${path} has a correctOptionId that is not in response.options.`);
    }
    if (question.type === "multiple_select") {
      strings(answer.correctOptionIds).forEach((optionId) => {
        if (!options.has(optionId)) errors.push(`${path} has correct option ${optionId} missing from response.options.`);
      });
    }
    if (question.type === "true_false_correct") {
      const correction = typeof answer.correction === "string" ? answer.correction.trim() : "";
      const alternatives = strings(answer.acceptedCorrections).map((value) => normalizedPrompt(value));
      if (answer.value === false && !correction) errors.push(`${path} is false but has no correction.`);
      if (answer.value === true && (correction || alternatives.length)) errors.push(`${path} is true but defines false-statement corrections.`);
      const allCorrections = [normalizedPrompt(correction), ...alternatives].filter(Boolean);
      if (new Set(allCorrections).size !== allCorrections.length) errors.push(`${path} has duplicate accepted corrections.`);
    }

    const promptKey = normalizedPrompt(question.prompt);
    const duplicate = prompts.get(promptKey);
    if (duplicate) warnings.push(`${id} appears semantically duplicative of ${duplicate}.`);
    else if (promptKey) prompts.set(promptKey, id);
  });

  let preview: BankPreview | null = null;
  if (bank && typeof input.schemaVersion === "string") {
    const grade = Number(bank.grade);
    const chapterNumber = Number(bank.chapterNumber);
    if (typeof bank.id === "string" && Number.isInteger(bank.version) && typeof bank.title === "string" &&
        typeof bank.subject === "string" && Number.isInteger(grade)) {
      preview = {
        bankId: bank.id,
        bankVersion: Number(bank.version),
        schemaVersion: input.schemaVersion,
        board: typeof bank.board === "string" ? bank.board : "ICSE",
        grade,
        subject: bank.subject,
        bookTitle: typeof bank.bookTitle === "string" ? bank.bookTitle : null,
        chapterNumber: Number.isInteger(chapterNumber) ? chapterNumber : null,
        chapterTitle: bank.title,
        questionCount: questions.length,
        sourceCount: sources.length,
        topicCount: topics.length,
      };
    }
  }

  const valid = errors.length === 0 && preview !== null && bank !== null;
  return {
    valid,
    errors,
    warnings,
    preview,
    value: valid ? { schemaVersion: String(input.schemaVersion), bank, sources, topics, questions } : null,
  };
}
