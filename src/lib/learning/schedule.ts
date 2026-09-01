export type SelfRating = "up" | "down";

export function reviewSchedule(input: { correct: boolean; rating?: SelfRating | null; repetitions?: number; now?: Date }) {
  const now = input.now ?? new Date();
  if (!input.correct || input.rating === "down") {
    return { dueAt: new Date(now.getTime() + 86_400_000), intervalDays: 1, repetitions: 0, reason: input.correct ? "low_confidence" as const : "incorrect" as const };
  }
  const repetitions = (input.repetitions ?? 0) + 1;
  const intervals = [3, 7, 14, 30, 60];
  const intervalDays = intervals[Math.min(repetitions - 1, intervals.length - 1)];
  return { dueAt: new Date(now.getTime() + intervalDays * 86_400_000), intervalDays, repetitions, reason: "maintenance" as const };
}
