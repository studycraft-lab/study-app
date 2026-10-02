import lesson from "@/content/english/question-tags.json";

export type QuestionTagQuestion = (typeof lesson.questions)[number];
export type QuestionTagResult = { id: string; number: number; correct: boolean; expectedAnswer: string; explanation: string };

export const QUESTION_TAGS_LESSON = lesson;
export const QUESTION_TAGS_BATCH_COUNT = lesson.questions.length / lesson.batchSize;

export function publicQuestion(question: QuestionTagQuestion) {
  return {
    id: question.id,
    number: question.number,
    kind: question.kind,
    prompt: question.prompt,
    options: "options" in question ? question.options : undefined,
    origin: question.origin,
  };
}

export function normalizeQuestionTag(value: string): string {
  return value.normalize("NFKC")
    .replace(/[\u2018\u2019\u02BC]/gu, "'")
    .trim()
    .replace(/\s*\?\s*$/u, "")
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("en");
}

export function gradeQuestionTagBatch(batchIndex: number, answers: string[]): QuestionTagResult[] {
  if (!Number.isInteger(batchIndex) || batchIndex < 0 || batchIndex >= QUESTION_TAGS_BATCH_COUNT ||
    answers.length !== lesson.batchSize || answers.some((answer) => typeof answer !== "string" || answer.length > 100)) {
    throw new Error("Invalid Question Tags batch.");
  }
  return lesson.questions.slice(batchIndex * lesson.batchSize, (batchIndex + 1) * lesson.batchSize).map((question, index) => ({
    id: question.id,
    number: question.number,
    correct: question.kind === "choice"
      ? answers[index].trim().toLowerCase() === question.answer
      : [question.answer, ...("accepted" in question && Array.isArray(question.accepted) ? question.accepted : [])]
        .some((accepted) => normalizeQuestionTag(answers[index]) === normalizeQuestionTag(accepted)),
    expectedAnswer: question.kind === "choice"
      ? question.options?.find((option) => option.id === question.answer)?.text ?? question.answer
      : question.answer,
    explanation: question.explanation,
  }));
}
