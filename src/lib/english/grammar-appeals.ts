import "server-only";

import type { ChildProfile } from "@/lib/family/store";
import { adminClient } from "@/lib/supabase/admin";
import { GRAMMAR_LESSONS, isGrammarSlug, type GrammarSlug } from "./grammar-lessons";
import { QUESTION_TAGS_LESSON } from "./question-tags";

export type AppealLessonSlug = GrammarSlug | "question-tags";
type ChildContext = ChildProfile & { familyId: string };
type AppealRow = { id: string; child_id: string; lesson_slug: string; content_version: number; batch_index: number; question_id: string; answer: string; original_status: string; status: string; resolved_status: string | null; child_comment: string | null; parent_comment: string | null; created_at: string };

function lesson(slug: AppealLessonSlug) { return slug === "question-tags" ? QUESTION_TAGS_LESSON : GRAMMAR_LESSONS[slug]; }
function storedAnswer(value: unknown, index: number): string {
  if (!Array.isArray(value)) return "";
  const item = value[index];
  return typeof item === "string" ? item : item && typeof item === "object" && typeof item.answer === "string" ? item.answer : "";
}
export function isAppealLessonSlug(value: string): value is AppealLessonSlug { return value === "question-tags" || isGrammarSlug(value); }

export async function listChildGrammarAppeals(childId: string, slug: AppealLessonSlug) {
  const { data, error } = await adminClient().from("grammar_appeals")
    .select("id,question_id,answer,status,resolved_status,parent_comment")
    .eq("child_id", childId).eq("lesson_slug", slug).eq("content_version", lesson(slug).version);
  if (error) throw error;
  return data ?? [];
}

export function applyGrammarAppeals<T extends { answers: string[]; results: { id: string; status?: string; correct?: boolean; explanation: string }[] }>(batches: T[], appeals: Awaited<ReturnType<typeof listChildGrammarAppeals>>): T[] {
  const byQuestion = new Map(appeals.map((appeal) => [appeal.question_id, appeal]));
  return batches.map((batch) => ({ ...batch, results: batch.results.map((result, index) => {
    const appeal = byQuestion.get(result.id);
    if (!appeal || appeal.answer !== batch.answers[index] || !appeal.resolved_status) return result;
    return { ...result, ...(typeof result.correct === "boolean" ? { correct: appeal.resolved_status === "correct" } : { status: appeal.resolved_status }),
      explanation: appeal.resolved_status === "correct" ? `Parent review: accepted this answer.${appeal.parent_comment ? ` ${appeal.parent_comment}` : ""}` : result.explanation };
  }) })) as T[];
}

export async function clearBatchGrammarAppeals(childId: string, slug: AppealLessonSlug, batchIndex: number) {
  const { error } = await adminClient().from("grammar_appeals").delete()
    .eq("child_id", childId).eq("lesson_slug", slug).eq("content_version", lesson(slug).version).eq("batch_index", batchIndex);
  if (error) throw error;
}
export async function clearLessonGrammarAppeals(childId: string, slug: AppealLessonSlug) {
  const { error } = await adminClient().from("grammar_appeals").delete()
    .eq("child_id", childId).eq("lesson_slug", slug).eq("content_version", lesson(slug).version);
  if (error) throw error;
}

export async function createGrammarAppeal(input: { child: ChildContext; slug: AppealLessonSlug; questionId: string; comment?: string }) {
  const source = lesson(input.slug);
  const index = source.questions.findIndex((question) => question.id === input.questionId);
  if (index < 0) throw new Error("Question not found.");
  const batchIndex = Math.floor(index / source.batchSize);
  const client = adminClient();
  const { data: progress, error: progressError } = await client.from("grammar_batch_progress").select("answers")
    .eq("child_id", input.child.id).eq("lesson_slug", input.slug).eq("content_version", source.version).eq("batch_index", batchIndex).maybeSingle();
  if (progressError || !progress) throw new Error("Check this batch before appealing an answer.");
  const position = index % source.batchSize;
  const answer = storedAnswer(progress.answers, position);
  if (!answer.trim()) throw new Error("A blank answer cannot be appealed.");
  const raw = Array.isArray(progress.answers) ? progress.answers[position] : null;
  const status = input.slug === "question-tags"
    ? (await import("./question-tags")).gradeQuestionTagBatch(batchIndex, (progress.answers as string[]))[position].correct ? "correct" : "incorrect"
    : raw && typeof raw === "object" && "result" in raw && raw.result && typeof raw.result === "object" && "status" in raw.result ? String(raw.result.status) : "incorrect";
  if (status === "correct") throw new Error("This answer is already correct.");
  const { data: existing, error: existingError } = await client.from("grammar_appeals").select("id,status,answer")
    .eq("child_id", input.child.id).eq("lesson_slug", input.slug).eq("content_version", source.version).eq("question_id", input.questionId).maybeSingle();
  if (existingError) throw existingError;
  if (existing && existing.answer === answer && existing.status !== "pending") throw new Error("Your parent has already reviewed this answer.");
  const payload = { family_id: input.child.familyId, child_id: input.child.id, lesson_slug: input.slug,
    content_version: source.version, batch_index: batchIndex, question_id: input.questionId, answer,
    original_status: status, child_comment: input.comment?.trim().slice(0, 1000) || null,
    status: "pending", resolved_status: null, parent_comment: null, resolved_at: null, resolver_name: null };
  const { data, error } = await client.from("grammar_appeals").upsert(payload,
    { onConflict: "child_id,lesson_slug,content_version,question_id" }).select("id,status").single();
  if (error || !data) throw new Error(error?.message ?? "Could not save the appeal.");
  return data;
}

export async function listParentGrammarAppeals(familyId: string) {
  const client = adminClient();
  const { data, error } = await client.from("grammar_appeals").select("*").eq("family_id", familyId).eq("status", "pending").order("created_at").limit(100);
  if (error) throw error;
  const rows = (data ?? []) as AppealRow[];
  if (!rows.length) return [];
  const { data: children, error: childrenError } = await client.from("child_profiles").select("id,display_name").in("id", [...new Set(rows.map((row) => row.child_id))]);
  if (childrenError) throw childrenError;
  const childNames = new Map((children ?? []).map((child) => [child.id, child.display_name]));
  return rows.map((row) => {
    const source = isAppealLessonSlug(row.lesson_slug) ? lesson(row.lesson_slug) : null;
    const question = source?.questions.find((item) => item.id === row.question_id);
    const choice = question && "options" in question ? question.options?.find((option) => option.id === row.answer) : null;
    return { id: row.id, childName: childNames.get(row.child_id) ?? "Child", lessonTitle: source?.title ?? row.lesson_slug,
      questionNumber: question?.number, question: question?.prompt ?? "Question unavailable", answer: choice?.text ?? row.answer,
      expectedAnswer: question?.answer ?? "", originalStatus: row.original_status, childComment: row.child_comment };
  });
}

export async function resolveGrammarAppeal(input: { appealId: string; familyId: string; resolverName: string; correct: boolean; comment?: string }) {
  const client = adminClient();
  const { data: appeal, error } = await client.from("grammar_appeals").select("*").eq("id", input.appealId).eq("family_id", input.familyId).eq("status", "pending").maybeSingle();
  if (error || !appeal || !isAppealLessonSlug(appeal.lesson_slug)) throw new Error("This appeal is no longer pending.");
  const { data: progress, error: progressError } = await client.from("grammar_batch_progress").select("answers")
    .eq("child_id", appeal.child_id).eq("lesson_slug", appeal.lesson_slug).eq("content_version", appeal.content_version).eq("batch_index", appeal.batch_index).maybeSingle();
  const source = lesson(appeal.lesson_slug);
  const position = source.questions.findIndex((question) => question.id === appeal.question_id) % source.batchSize;
  if (progressError || !progress || position < 0 || storedAnswer(progress.answers, position) !== appeal.answer) throw new Error("The child has changed this answer. Refresh the appeal list.");
  const finalStatus = input.correct ? "correct" : "incorrect";
  const { error: updateError } = await client.from("grammar_appeals").update({ status: finalStatus === appeal.original_status ? "confirmed" : "adjusted",
    resolved_status: finalStatus, parent_comment: input.comment?.trim().slice(0, 1000) || null,
    resolver_name: input.resolverName, resolved_at: new Date().toISOString() })
    .eq("id", input.appealId).eq("family_id", input.familyId).eq("status", "pending");
  if (updateError) throw updateError;
  return { status: finalStatus };
}
