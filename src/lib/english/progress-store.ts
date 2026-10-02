import "server-only";

import { adminClient } from "@/lib/supabase/admin";
import { QUESTION_TAGS_LESSON, gradeQuestionTagBatch } from "./question-tags";

export type QuestionTagBatchProgress = {
  batchIndex: number;
  answers: string[];
  results: ReturnType<typeof gradeQuestionTagBatch>;
};

type Row = { batch_index: number; answers: unknown };

function progress(row: Row): QuestionTagBatchProgress {
  const answers = row.answers;
  if (!Array.isArray(answers) || answers.some((answer) => typeof answer !== "string")) throw new Error("Saved Question Tags answers are invalid.");
  return { batchIndex: row.batch_index, answers, results: gradeQuestionTagBatch(row.batch_index, answers) };
}

export async function loadQuestionTagProgress(childId: string): Promise<QuestionTagBatchProgress[]> {
  const { data, error } = await adminClient().from("grammar_batch_progress")
    .select("batch_index,answers")
    .eq("child_id", childId)
    .eq("lesson_slug", QUESTION_TAGS_LESSON.slug)
    .eq("content_version", QUESTION_TAGS_LESSON.version)
    .order("batch_index");
  if (error) throw error;
  return (data ?? []).map((row) => progress(row as Row));
}

export async function saveQuestionTagProgress(childId: string, batchIndex: number, answers: string[]): Promise<QuestionTagBatchProgress> {
  const results = gradeQuestionTagBatch(batchIndex, answers);
  const { data, error } = await adminClient().from("grammar_batch_progress").upsert({
    child_id: childId,
    lesson_slug: QUESTION_TAGS_LESSON.slug,
    content_version: QUESTION_TAGS_LESSON.version,
    batch_index: batchIndex,
    answers,
    updated_at: new Date().toISOString(),
  }, { onConflict: "child_id,lesson_slug,content_version,batch_index" }).select("batch_index,answers").single();
  if (error || !data) throw error ?? new Error("Question Tags progress could not be saved.");
  return { batchIndex, answers, results };
}

export async function clearQuestionTagProgress(childId: string): Promise<void> {
  const { error } = await adminClient().from("grammar_batch_progress")
    .delete().eq("child_id", childId)
    .eq("lesson_slug", QUESTION_TAGS_LESSON.slug)
    .eq("content_version", QUESTION_TAGS_LESSON.version);
  if (error) throw error;
}
