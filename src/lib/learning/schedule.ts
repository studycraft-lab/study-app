export function reviewSchedule(input: { correct: boolean; repetitions?: number; now?: Date }) {
  const now = input.now ?? new Date();
  if (!input.correct) {
    return { dueAt: new Date(now.getTime() + 86_400_000), intervalDays: 1, repetitions: 0, reason: "incorrect" as const };
  }
  const repetitions = (input.repetitions ?? 0) + 1;
  const intervals = [3, 7, 14, 30, 60];
  const intervalDays = intervals[Math.min(repetitions - 1, intervals.length - 1)];
  return { dueAt: new Date(now.getTime() + intervalDays * 86_400_000), intervalDays, repetitions, reason: "maintenance" as const };
}
