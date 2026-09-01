import "server-only";

import { adminClient } from "@/lib/supabase/admin";
import type { ChildProfile } from "@/lib/family/store";
import { selectableQuestionIds } from "@/lib/study/session";
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

export async function createStudySession(input: { child: ChildContext; bankId: string; bank: RecordValue; questionIds: string[]; presentationSeed: string }) {
  const { data, error } = await adminClient().from("study_sessions").insert({
    child_id: input.child.id, question_bank_id: input.bankId, bank_version: bankVersion(input.bank), total_questions: input.questionIds.length, question_ids: input.questionIds, presentation_seed: input.presentationSeed,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Study session could not be started.");
  return String(data.id);
}

export async function questionSelectionHistory(childId: string, bankId: string) {
  const client = adminClient();
  const [{ data: attempts, error: attemptError }, { data: reviews, error: reviewError }] = await Promise.all([
    client.from("study_attempts").select("question_id,correct,attempted_at").eq("child_id", childId).eq("question_bank_id", bankId).order("attempted_at", { ascending: false }),
    client.from("review_items").select("question_id,due_at").eq("child_id", childId).eq("question_bank_id", bankId),
  ]);
  if (attemptError || reviewError) throw new Error(attemptError?.message ?? reviewError?.message ?? "Question history is unavailable.");
  const latest = new Map<string, { correct: boolean }>();
  (attempts ?? []).forEach((attempt) => { if (!latest.has(attempt.question_id)) latest.set(attempt.question_id, { correct: Boolean(attempt.correct) }); });
  const due = new Set((reviews ?? []).filter((item) => new Date(item.due_at).getTime() <= Date.now()).map((item) => String(item.question_id)));
  const questionIds = new Set([
    ...(attempts ?? []).map((item) => String(item.question_id)),
    ...(reviews ?? []).map((item) => String(item.question_id)),
  ]);
  return [...questionIds].map((questionId) => ({
    questionId, attempted: latest.has(questionId), latestCorrect: latest.get(questionId)?.correct ?? false, due: due.has(questionId),
  }));
}

export async function chapterCoverage(childId: string, bankIds: string[]) {
  if (!bankIds.length) return {} as Record<string, { questionCount: number; correctEver: number; coveragePercent: number; fullCoverage: boolean }>;
  const client = adminClient();
  const [{ data: banks, error: bankError }, { data: attempts, error: attemptError }] = await Promise.all([
    client.from("question_banks").select("id,payload").in("id", bankIds),
    client.from("study_attempts").select("question_bank_id,question_id").eq("child_id", childId).eq("correct", true).in("question_bank_id", bankIds),
  ]);
  if (bankError || attemptError) throw new Error(bankError?.message ?? attemptError?.message ?? "Chapter coverage is unavailable.");
  const correctByBank = new Map<string, Set<string>>();
  (attempts ?? []).forEach((attempt) => {
    const bankId = String(attempt.question_bank_id);
    if (!correctByBank.has(bankId)) correctByBank.set(bankId, new Set());
    correctByBank.get(bankId)?.add(String(attempt.question_id));
  });
  return Object.fromEntries((banks ?? []).map((bank) => {
    const activeIds = new Set(selectableQuestionIds(bank.payload));
    const correctEver = [...(correctByBank.get(String(bank.id)) ?? [])].filter((id) => activeIds.has(id)).length;
    const questionCount = activeIds.size;
    return [String(bank.id), { questionCount, correctEver, coveragePercent: questionCount ? Math.round(correctEver / questionCount * 100) : 0, fullCoverage: questionCount > 0 && correctEver === questionCount }];
  }));
}

export async function resumableStudySession(sessionId: string, childId: string) {
  const client = adminClient();
  const { data: session, error: sessionError } = await client.from("study_sessions")
    .select("id,question_bank_id,status,total_questions,question_ids,presentation_seed")
    .eq("id", sessionId).eq("child_id", childId).maybeSingle();
  if (sessionError || !session || session.status !== "in_progress" || !Array.isArray(session.question_ids)) throw new Error("This unfinished session cannot be resumed.");
  const { data: attempts, error: attemptError } = await client.from("study_attempts")
    .select("id,question_id,response,correct,earned_marks,max_marks,feedback,attempted_at")
    .eq("session_id", sessionId).eq("child_id", childId).order("attempted_at");
  if (attemptError) throw new Error(attemptError.message);
  return { bankId: String(session.question_bank_id), questionIds: session.question_ids.map(String), presentationSeed: typeof session.presentation_seed === "string" ? session.presentation_seed : undefined, attempts: attempts ?? [] };
}

export async function completeStudySession(sessionId: string, childId: string) {
  const { error } = await adminClient().from("study_sessions").update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId).eq("child_id", childId).eq("status", "in_progress");
  if (error) throw new Error(error.message);
}

export async function purgeStudySession(sessionId: string, childId: string) {
  const { data, error } = await adminClient().rpc("purge_study_session", { p_session_id: sessionId, p_child_id: childId });
  if (error) throw new Error(error.message);
  const result = Array.isArray(data) ? data[0] : data;
  return { sessionId, deletedAttempts: Number(result?.deleted_attempts ?? 0) };
}

async function sessionBelongsToChild(sessionId: string, childId: string, bankId: string, questionId: string) {
  const { data, error } = await adminClient().from("study_sessions").select("id,question_ids").eq("id", sessionId).eq("child_id", childId).eq("question_bank_id", bankId).maybeSingle();
  if (error || !data || (Array.isArray(data.question_ids) && !data.question_ids.includes(questionId))) throw new Error("Study session is unavailable.");
}

async function upsertReview(input: { childId: string; bankId: string; bankVersion: number; questionId: string; questionVersion: number; attemptId: string; correct: boolean }) {
  const client = adminClient();
  const { data: existing } = await client.from("review_items").select("repetitions").eq("child_id", input.childId).eq("question_bank_id", input.bankId)
    .eq("bank_version", input.bankVersion).eq("question_id", input.questionId).eq("question_version", input.questionVersion).maybeSingle();
  const schedule = reviewSchedule({ correct: input.correct, repetitions: Number(existing?.repetitions ?? 0) });
  const { error } = await client.from("review_items").upsert({
    child_id: input.childId, question_bank_id: input.bankId, bank_version: input.bankVersion,
    question_id: input.questionId, question_version: input.questionVersion,
    due_at: schedule.dueAt.toISOString(), interval_days: schedule.intervalDays, repetitions: schedule.repetitions,
    reason: schedule.reason, last_attempt_id: input.attemptId, updated_at: new Date().toISOString(),
  }, { onConflict: "child_id,question_bank_id,bank_version,question_id,question_version" });
  if (error) throw new Error(error.message);
}

export async function recordStudyAttempt(input: { sessionId: string; child: ChildContext; bankId: string; bank: RecordValue; questionId: string; response: unknown; feedback: RecordValue }) {
  await sessionBelongsToChild(input.sessionId, input.child.id, input.bankId, input.questionId);
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
  await upsertReview({ childId: input.child.id, bankId: input.bankId, bankVersion: version, questionId: input.questionId, questionVersion: Number(item.version || 1), attemptId, correct: Boolean(input.feedback.correct) });
  return attemptId;
}

export async function childLearningHistory(child: ChildContext) {
  const client = adminClient();
  const [{ data: sessions, error: sessionError }, { data: attempts, error: attemptError }, { count: dueCount, error: dueError }] = await Promise.all([
    client.from("study_sessions").select("id,question_bank_id,status,started_at,completed_at,total_questions,question_ids").eq("child_id", child.id).order("started_at", { ascending: false }).limit(12),
    client.from("study_attempts").select("id,session_id,question_bank_id,question_id,question_prompt,topic_ids,response,correct,earned_marks,max_marks,feedback,self_rating,attempted_at").eq("child_id", child.id).order("attempted_at", { ascending: false }).limit(100),
    client.from("review_items").select("id", { count: "exact", head: true }).eq("child_id", child.id).lte("due_at", new Date().toISOString()),
  ]);
  if (sessionError || attemptError || dueError) throw new Error(sessionError?.message ?? attemptError?.message ?? dueError?.message ?? "Learning history is unavailable.");
  const allAttempts = attempts ?? [];
  const latestByQuestion = new Map<string, typeof allAttempts[number]>();
  allAttempts.forEach((attempt) => { const key = `${attempt.question_bank_id}:${attempt.question_id}`; if (!latestByQuestion.has(key)) latestByQuestion.set(key, attempt); });
  const latest = [...latestByQuestion.values()];
  const earnedMarks = allAttempts.reduce((sum, attempt) => sum + Number(attempt.earned_marks), 0);
  const possibleMarks = allAttempts.reduce((sum, attempt) => sum + Number(attempt.max_marks), 0);
  const masteryPoints = latest.map((attempt) => Number(attempt.earned_marks) / Number(attempt.max_marks));
  const topicIds = [...new Set(allAttempts.flatMap((attempt) => attempt.topic_ids ?? []))];
  const topics = topicIds.map((topicId) => {
    const topicAttempts = allAttempts.filter((attempt) => attempt.topic_ids?.includes(topicId));
    const topicLatest = latest.filter((attempt) => attempt.topic_ids?.includes(topicId));
    const topicEarned = topicAttempts.reduce((sum, attempt) => sum + Number(attempt.earned_marks), 0);
    const topicPossible = topicAttempts.reduce((sum, attempt) => sum + Number(attempt.max_marks), 0);
    const topicMastery = topicLatest.map((attempt) => Number(attempt.earned_marks) / Number(attempt.max_marks));
    return {
      topicId,
      attempts: topicAttempts.length,
      accuracy: topicPossible ? Math.round(topicEarned / topicPossible * 100) : 0,
      mastery: Math.round(topicMastery.reduce<number>((sum, value) => sum + value, 0) / topicMastery.length * 100),
    };
  });
  return {
    summary: {
      completedSessions: (sessions ?? []).filter((session) => session.status === "completed").length,
      attempts: allAttempts.length,
      uniqueQuestions: latest.length,
      accuracy: possibleMarks ? Math.round(earnedMarks / possibleMarks * 100) : 0,
      mastery: masteryPoints.length ? Math.round(masteryPoints.reduce<number>((sum, value) => sum + value, 0) / masteryPoints.length * 100) : 0,
      dueReview: dueCount ?? 0,
    },
    topics,
    sessions: (sessions ?? []).map((session) => ({
      id: session.id, bankId: session.question_bank_id, status: session.status, startedAt: session.started_at, completedAt: session.completed_at,
      totalQuestions: session.total_questions, resumable: session.status === "in_progress" && Array.isArray(session.question_ids),
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
