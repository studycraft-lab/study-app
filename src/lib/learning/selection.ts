export type QuestionSelectionHistory = {
  questionId: string;
  attempted: boolean;
  latestCorrect: boolean;
  due: boolean;
};

export type QuestionSelectionMetadata = {
  origin?: "end_exercise" | "chapter_content" | "learning_outcome";
  priority?: number;
};

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function prioritized(values: string[], metadata: Record<string, QuestionSelectionMetadata>, random: () => number): string[] {
  return [1, 2, 3, 4].flatMap((priority) => shuffled(values.filter((id) => {
    const value = metadata[id]?.priority;
    return priority === 4 ? ![1, 2, 3].includes(Number(value)) : value === priority;
  }), random));
}

function selectFromPool(candidateIds: string[], history: QuestionSelectionHistory[], limit: number, random: () => number, metadata: Record<string, QuestionSelectionMetadata> = {}): string[] {
  const byId = new Map(history.map((item) => [item.questionId, item]));
  const weak = prioritized(candidateIds.filter((id) => { const item = byId.get(id); return item?.due || (item?.attempted && !item.latestCorrect); }), metadata, random);
  const unseen = prioritized(candidateIds.filter((id) => !byId.get(id)?.attempted), metadata, random);
  const reinforcement = prioritized(candidateIds.filter((id) => { const item = byId.get(id); return item?.attempted && item.latestCorrect && !item.due; }), metadata, random);
  const chosen: string[] = [];
  const add = (values: string[], count = values.length) => values.some((id) => {
    if (chosen.length >= limit || count <= 0) return true;
    if (!chosen.includes(id)) { chosen.push(id); count -= 1; }
    return false;
  });

  add(weak, unseen.length ? 2 : limit);
  add(unseen);
  add(weak);
  add(reinforcement);
  return chosen.slice(0, limit);
}

/** Select a balanced exercise: seven objective questions and three subjective ones when available. */
export function selectQuestionIds(
  candidateIds: string[],
  history: QuestionSelectionHistory[],
  limit = 5,
  random: () => number = Math.random,
  questionTypes?: Record<string, string>,
  questionMetadata: Record<string, QuestionSelectionMetadata> = {},
): string[] {
  const subjective = new Set(["brief_answer", "multi_point", "compare"]);
  const historyById = new Map(history.map((item) => [item.questionId, item]));
  const exerciseIds = candidateIds.filter((id) => questionMetadata[id]?.origin === "end_exercise");
  const reserveExercises = exerciseIds.some((id) => !historyById.get(id)?.attempted);
  const exerciseLimit = reserveExercises ? Math.min(Math.floor(limit / 2), exerciseIds.length) : 0;
  const chosen: string[] = [];
  const add = (ids: string[]) => ids.forEach((id) => { if (chosen.length < limit && !chosen.includes(id)) chosen.push(id); });

  if (!questionTypes || limit < 10) {
    if (exerciseLimit) add(selectFromPool(exerciseIds, history, exerciseLimit, random, questionMetadata));
    add(selectFromPool(candidateIds.filter((id) => !chosen.includes(id)), history, limit - chosen.length, random, questionMetadata));
    return chosen.slice(0, limit);
  }

  const subjectiveIds = candidateIds.filter((id) => subjective.has(questionTypes[id]));
  const objectiveIds = candidateIds.filter((id) => !subjective.has(questionTypes[id]));
  if (exerciseLimit) {
    const exerciseObjective = exerciseIds.filter((id) => !subjective.has(questionTypes[id]));
    const exerciseSubjective = exerciseIds.filter((id) => subjective.has(questionTypes[id]));
    const desiredObjective = Math.min(exerciseObjective.length, Math.ceil(exerciseLimit * OBJECTIVE_QUESTIONS_PER_EXERCISE / limit));
    const desiredSubjective = Math.min(exerciseSubjective.length, exerciseLimit - desiredObjective);
    add(selectFromPool(exerciseObjective, history, desiredObjective, random, questionMetadata));
    add(selectFromPool(exerciseSubjective, history, desiredSubjective, random, questionMetadata));
    if (chosen.length < exerciseLimit) add(selectFromPool(exerciseIds.filter((id) => !chosen.includes(id)), history, exerciseLimit - chosen.length, random, questionMetadata));
  }
  const chosenObjective = chosen.filter((id) => !subjective.has(questionTypes[id])).length;
  const chosenSubjective = chosen.filter((id) => subjective.has(questionTypes[id])).length;
  add(selectFromPool(objectiveIds.filter((id) => !chosen.includes(id)), history, Math.max(0, OBJECTIVE_QUESTIONS_PER_EXERCISE - chosenObjective), random, questionMetadata));
  add(selectFromPool(subjectiveIds.filter((id) => !chosen.includes(id)), history, Math.max(0, SUBJECTIVE_QUESTIONS_PER_EXERCISE - chosenSubjective), random, questionMetadata));
  if (chosen.length < limit) {
    const remaining = candidateIds.filter((id) => !chosen.includes(id));
    add(selectFromPool(remaining, history, limit - chosen.length, random, questionMetadata));
  }
  return shuffled(chosen.slice(0, limit), random);
}
import { OBJECTIVE_QUESTIONS_PER_EXERCISE, SUBJECTIVE_QUESTIONS_PER_EXERCISE } from "@/lib/study/config";
