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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string | null {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path}.${key} must be a non-empty string.`);
    return null;
  }
  return value.trim();
}

function positiveInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): number | null {
  const value = record[key];
  if (!Number.isInteger(value) || Number(value) < 1) {
    errors.push(`${path}.${key} must be a positive integer.`);
    return null;
  }
  return Number(value);
}

export function validateQuestionBank(input: unknown): BankValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["The uploaded file must contain a JSON object."], warnings, preview: null, value: null };
  }

  const schemaVersion = requiredString(input, "schemaVersion", "root", errors);
  if (schemaVersion && schemaVersion !== "0.1.0") {
    errors.push(`Unsupported schemaVersion ${schemaVersion}. Expected 0.1.0.`);
  }

  const bank = isRecord(input.bank) ? input.bank : null;
  if (!bank) errors.push("root.bank must be an object.");
  const sources = Array.isArray(input.sources) ? input.sources.filter(isRecord) : [];
  const topics = Array.isArray(input.topics) ? input.topics.filter(isRecord) : [];
  const questions = Array.isArray(input.questions) ? input.questions.filter(isRecord) : [];
  if (!Array.isArray(input.sources)) errors.push("root.sources must be an array.");
  if (!Array.isArray(input.topics)) errors.push("root.topics must be an array.");
  if (!Array.isArray(input.questions)) errors.push("root.questions must be an array.");
  if (questions.length === 0) errors.push("The bank must contain at least one question.");

  let preview: BankPreview | null = null;
  if (bank && schemaVersion) {
    const bankId = requiredString(bank, "id", "bank", errors);
    const bankVersion = positiveInteger(bank, "version", "bank", errors);
    const chapterTitle = requiredString(bank, "title", "bank", errors);
    const subject = requiredString(bank, "subject", "bank", errors);
    const grade = positiveInteger(bank, "grade", "bank", errors);
    const board = typeof bank.board === "string" && bank.board.trim() ? bank.board.trim() : "ICSE";
    const bookTitle = typeof bank.bookTitle === "string" && bank.bookTitle.trim() ? bank.bookTitle.trim() : null;
    const chapterNumber = Number.isInteger(bank.chapterNumber) && Number(bank.chapterNumber) > 0 ? Number(bank.chapterNumber) : null;

    if (bankId && bankVersion && chapterTitle && subject && grade) {
      preview = {
        bankId,
        bankVersion,
        schemaVersion,
        board,
        grade,
        subject,
        bookTitle,
        chapterNumber,
        chapterTitle,
        questionCount: questions.length,
        sourceCount: sources.length,
        topicCount: topics.length,
      };
    }
  }

  const sourceIds = new Set<string>();
  const sourceRegions = new Map<string, Set<string>>();
  sources.forEach((source, index) => {
    const id = requiredString(source, "id", `sources[${index}]`, errors);
    if (id) {
      if (sourceIds.has(id)) errors.push(`Duplicate source id ${id}.`);
      sourceIds.add(id);
      const regions = new Set<string>();
      if (Array.isArray(source.regions)) {
        source.regions.filter(isRecord).forEach((region) => {
          if (typeof region.id === "string") regions.add(region.id);
        });
      }
      sourceRegions.set(id, regions);
    }
    if (!Number.isInteger(source.pageNumber)) errors.push(`sources[${index}].pageNumber must be an integer.`);
    if (typeof source.extractionConfidence === "number" && source.extractionConfidence < 0.85) {
      warnings.push(`Source ${id ?? index} has low extraction confidence.`);
    }
    if (source.reviewRequired === true) warnings.push(`Source ${id ?? index} requires review.`);
  });

  const topicIds = new Set<string>();
  topics.forEach((topic, index) => {
    const id = requiredString(topic, "id", `topics[${index}]`, errors);
    requiredString(topic, "title", `topics[${index}]`, errors);
    if (id) topicIds.add(id);
  });

  const questionIds = new Set<string>();
  questions.forEach((question, index) => {
    const path = `questions[${index}]`;
    const id = requiredString(question, "id", path, errors);
    requiredString(question, "type", path, errors);
    requiredString(question, "prompt", path, errors);
    positiveInteger(question, "version", path, errors);
    if (id) {
      if (questionIds.has(id)) errors.push(`Duplicate question id ${id}.`);
      questionIds.add(id);
    }
    if (typeof question.marks !== "number" || question.marks <= 0) errors.push(`${path}.marks must be greater than zero.`);
    if (!isRecord(question.answer)) errors.push(`${path}.answer must be an object.`);
    if (!isRecord(question.rubric)) errors.push(`${path}.rubric must be an object.`);

    const refs = Array.isArray(question.sourceRefs) ? question.sourceRefs.filter(isRecord) : [];
    if (refs.length === 0) errors.push(`${path} must cite at least one source page.`);
    refs.forEach((ref) => {
      const pageId = typeof ref.pageId === "string" ? ref.pageId : "";
      if (!sourceIds.has(pageId)) errors.push(`${path} cites missing source page ${pageId || "(blank)"}.`);
      if (typeof ref.regionId === "string" && !sourceRegions.get(pageId)?.has(ref.regionId)) {
        errors.push(`${path} cites missing region ${ref.regionId} on ${pageId}.`);
      }
    });

    const referencedTopics = Array.isArray(question.topicIds) ? question.topicIds : [];
    referencedTopics.forEach((topicId) => {
      if (typeof topicId !== "string" || !topicIds.has(topicId)) errors.push(`${path} cites missing topic ${String(topicId)}.`);
    });
  });

  const valid = errors.length === 0 && preview !== null;
  return {
    valid,
    errors,
    warnings,
    preview,
    value: valid
      ? { schemaVersion: schemaVersion!, bank: bank!, sources, topics, questions }
      : null,
  };
}
