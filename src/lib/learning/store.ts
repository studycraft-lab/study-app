import "server-only";

import { adminClient } from "@/lib/supabase/admin";
import type { ChildProfile } from "@/lib/family/store";
import type { SelfRating } from "./schedule";
import { reviewSchedule } from "./schedule";

type ChildContext = ChildProfile & { familyId: string };
type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordValue : {};
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function bankVersion(bank: RecordValue): number {
  return Number(record(bank.bank).version || 1);
}

function question(bank: RecordValue, questionId: string) {
  const value = records(bank.questions).find((item) => item.id === questionId);
  if (!value) throw new Error("Question is unavailable.");
  return value;
}

export async function createStudySession(input: { child: ChildContext; bankId: string; bank: RecordValue; totalQuestions: number }) {
  const { data, error } = await adminClient().from("study_sessions").insert({
    child_id: input.child.id, question_bank_id: input.bankId, bank_version: bankVersion(input.bank), total_questions: input.totalQuestions,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Study session could not be started.");
  return String(data.id);
}

export async function completeStudySession(sessionId: string, childId: string) {
  const { error } = await adminClient().from("study_sessions").update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId).eq("child_id", childId).eq("status", "in_progress");
  if (error) throw new Error(error.message);
}

async function sessionBelongsToChild(sessionId: string, childId: string, bankId: string) {
  const { data, error } = await adminClient().from("study_sessions").select("id").eq("id", sessionId).eq("child_id", childId).eq("question_bank_id", bankId).maybeSingle();
  if (error || !data) throw new Error("Study session is unavailable.");
}

async function upsertReview(input: { childId: string; bankId: string; bankVersion: number; questionId: string; questionVersion: number; attemptId: string; correct: boolean; rating?: SelfRating | null }) {
  const client = adminClient();
  const { data: existing } = await client.from("review_items").select("repetitions").eq("child_id", input.childId).eq("question_bank_id", input.bankId)
    .eq("bank_version", input.bankVersion).eq("question_id", input.questionId).eq("question_version", input.questionVersion).maybeSingle();
  const schedule = reviewSchedule({ correct: input.correct, rating: input.rating, repetitions: Number(existing?.repetitions ?? 0) });
  const { error } = await client.from("review_items").upsert({
    child_id: input.childId, question_bank_id: input.bankId, bank_version: input.bankVersion,
    question_id: input.questionId, question_version: input.questionVersion,
    due_at: schedule.dueAt.toISOString(), interval_days: schedule.intervalDays, repetitions: schedule.repetitions,
    reason: schedule.reason, last_attempt_id: input.attemptId, updated_at: new Date().toISOString(),
  }, { onConflict: "child_id,question_bank_id,bank_version,question_id,question_version" });
  if (error) throw new Error(error.message);
}

export async function recordStudyAttempt(input: { sessionId: string; child: ChildContext; bankId: string; bank: RecordValue; questionId: string; response: unknown; feedback: RecordValue }) {
  await sessionBelongsToChild(input.sessionId, input.child.id, input.bankId);
  const item = question(input.bank, input.questionId);
  const version = bankVersion(input.bank);
  const { data, error } = await adminClient().from("study_attempts").insert({
    session_id: input.sessionId, child_id: input.child.id, question_bank_id: input.bankId, bank_version: version,
    question_id: input.questionId, question_version: Number(item.version || 1), question_prompt: String(item.prompt ?? ""),
    topic_ids: Array.isArray(item.topicIds) ? item.topicIds : [], response: input.response,
    correct: Boolean(input.feedback.correct), earned_marks: Number(input.feedback.earnedMarks ?? 0), max_marks: Number(item.marks ?? 1), feedback: input.feedback,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Attempt could not be saved.");
  const attemptId = String(data.id);
  if (!input.feedback.correct) await upsertReview({ childId: input.child.id, bankId: input.bankId, bankVersion: version, questionId: input.questionId, questionVersion: Number(item.version || 1), attemptId, correct: false });
  return attemptId;
}

export async function rateStudyAttempt(input: { attemptId: string; childId: string; rating: SelfRating }) {
  const client = adminClient();
  const { data, error } = await client.from("study_attempts").update({ self_rating: input.rating }).eq("id", input.attemptId).eq("child_id", input.childId)
    .select("id,question_bank_id,bank_version,question_id,question_version,correct").single();
  if (error || !data) throw new Error("Attempt is unavailable.");
  await upsertReview({ childId: input.childId, bankId: data.question_bank_id, bankVersion: data.bank_version, questionId: data.question_id, questionVersion: data.question_version, attemptId: data.id, correct: Boolean(data.correct), rating: input.rating });
}

export async function childLearningHistory(child: ChildContext) {
  const client = adminClient();
  const [{ data: sessions, error: sessionError }, { data: attempts, error: attemptError }, { count: dueCount, error: dueError }] = await Promise.all([
    client.from("study_sessions").select("id,question_bank_id,status,started_at,completed_at,total_questions").eq("child_id", child.id).order("started_at", { ascending: false }).limit(12),
    client.from("study_attempts").select("id,session_id,question_bank_id,question_id,question_prompt,topic_ids,response,correct,earned_marks,max_marks,feedback,self_rating,attempted_at").eq("child_id", child.id).order("attempted_at", { ascending: false }).limit(100),
    client.from("review_items").select("id", { count: "exact", head: true }).eq("child_id", child.id).lte("due_at", new Date().toISOString()),
  ]);
  if (sessionError || attemptError || dueError) throw new Error(sessionError?.message ?? attemptError?.message ?? dueError?.message ?? "Learning history is unavailable.");
  const allAttempts = attempts ?? [];
  const latestByQuestion = new Map<string, typeof allAttempts[number]>();
  allAttempts.forEach((attempt) => { const key = `${attempt.question_bank_id}:${attempt.question_id}`; if (!latestByQuestion.has(key)) latestByQuestion.set(key, attempt); });
  const latest = [...latestByQuestion.values()];
  const correct = allAttempts.filter((attempt) => attempt.correct).length;
  const masteryPoints = latest.map((attempt) => !attempt.correct ? 0 : attempt.self_rating === "down" ? .55 : attempt.self_rating === "up" ? 1 : .8);
  const topicIds = [...new Set(allAttempts.flatMap((attempt) => attempt.topic_ids ?? []))];
  const topics = topicIds.map((topicId) => {
    const topicAttempts = allAttempts.filter((attempt) => attempt.topic_ids?.includes(topicId));
    const topicLatest = latest.filter((attempt) => attempt.topic_ids?.includes(topicId));
    const topicMastery = topicLatest.map((attempt) => !attempt.correct ? 0 : attempt.self_rating === "down" ? .55 : attempt.self_rating === "up" ? 1 : .8);
    return {
      topicId,
      attempts: topicAttempts.length,
      accuracy: Math.round(topicAttempts.filter((attempt) => attempt.correct).length / topicAttempts.length * 100),
      mastery: Math.round(topicMastery.reduce<number>((sum, value) => sum + value, 0) / topicMastery.length * 100),
    };
  });
  return {
    summary: {
      completedSessions: (sessions ?? []).filter((session) => session.status === "completed").length,
      attempts: allAttempts.length,
      uniqueQuestions: latest.length,
      accuracy: allAttempts.length ? Math.round(correct / allAttempts.length * 100) : 0,
      mastery: masteryPoints.length ? Math.round(masteryPoints.reduce<number>((sum, value) => sum + value, 0) / masteryPoints.length * 100) : 0,
      dueReview: dueCount ?? 0,
    },
    topics,
    sessions: (sessions ?? []).map((session) => ({
      id: session.id, bankId: session.question_bank_id, status: session.status, startedAt: session.started_at, completedAt: session.completed_at,
      attempts: allAttempts.filter((attempt) => attempt.session_id === session.id).reverse(),
    })),
  };
}

export async function familyLearningHistory(children: ChildProfile[]) {
  return Promise.all(children.map(async (profile) => ({ child: profile, history: await childLearningHistory({ ...profile, familyId: "" }) })));
}

export async function dueReviewQuestionIds(childId: string) {
  const { data, error } = await adminClient().from("review_items").select("question_bank_id,question_id,due_at").eq("child_id", childId).lte("due_at", new Date().toISOString()).order("due_at").limit(5);
  if (error) throw new Error(error.message);
  if (!data?.length) return null;
  const bankId = String(data[0].question_bank_id);
  return { bankId, questionIds: data.filter((item) => item.question_bank_id === bankId).map((item) => String(item.question_id)) };
}
