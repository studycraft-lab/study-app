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

export function selectQuestionIds(candidateIds: string[], history: QuestionSelectionHistory[], limit = 5, random: () => number = Math.random): string[] {
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
