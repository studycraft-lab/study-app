import "server-only";
export const voiceDefaults = { sessionSeconds: 600, dailySeconds: 1200, startsPerMinute: 3 };
function seconds(value: string | undefined, fallback: number, maximum: number) {
  const n = Number(value); return Number.isInteger(n) && n >= 60 && n <= maximum ? n : fallback;
}
export function voiceConfig() {
  return { model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2.1", voice: process.env.OPENAI_REALTIME_VOICE ?? "marin", sessionSeconds: seconds(process.env.TUTOR_SESSION_SECONDS, 600, 1200), dailySeconds: seconds(process.env.TUTOR_DAILY_SECONDS, 1200, 3600), startsPerMinute: voiceDefaults.startsPerMinute };
}
export function voiceUnavailableReason(): string | null {
  if (process.env.TUTOR_ENABLED !== "true" || process.env.TUTOR_LIVE_ENABLED !== "true") return "Live tutoring is disabled. Scripted rehearsal is available.";
  if (!process.env.OPENAI_API_KEY) return "Live voice is not configured. Scripted rehearsal is available.";
  if (!process.env.TUTOR_CONTROLLER_URL || !process.env.TUTOR_CONTROLLER_SECRET || process.env.TUTOR_CONTROLLER_VERIFIED !== "true") return "Live voice is awaiting server usage-control verification. Scripted rehearsal is available.";
  return null;
}
