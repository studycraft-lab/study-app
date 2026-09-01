export type QuestionSelectionHistory = {
  questionId: string;
  attempted: boolean;
  latestCorrect: boolean;
  due: boolean;
};

function shuffled<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function selectFromPool(candidateIds: string[], history: QuestionSelectionHistory[], limit: number, random: () => number): string[] {
  const byId = new Map(history.map((item) => [item.questionId, item]));
  const weak = shuffled(candidateIds.filter((id) => { const item = byId.get(id); return item?.due || (item?.attempted && !item.latestCorrect); }), random);
  const unseen = shuffled(candidateIds.filter((id) => !byId.get(id)?.attempted), random);
  const reinforcement = shuffled(candidateIds.filter((id) => { const item = byId.get(id); return item?.attempted && item.latestCorrect && !item.due; }), random);
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
): string[] {
  if (!questionTypes || limit < 10) return selectFromPool(candidateIds, history, limit, random);
  const subjective = new Set(["brief_answer", "multi_point", "compare"]);
  const subjectiveIds = candidateIds.filter((id) => subjective.has(questionTypes[id]));
  const objectiveIds = candidateIds.filter((id) => !subjective.has(questionTypes[id]));
  const chosen = [
    ...selectFromPool(objectiveIds, history, Math.min(7, objectiveIds.length), random),
    ...selectFromPool(subjectiveIds, history, Math.min(3, subjectiveIds.length), random),
  ];
  if (chosen.length < limit) {
    const remaining = candidateIds.filter((id) => !chosen.includes(id));
    chosen.push(...selectFromPool(remaining, history, limit - chosen.length, random));
  }
  return chosen.slice(0, limit);
}
