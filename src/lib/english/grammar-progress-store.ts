import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { GRAMMAR_LESSONS, gradeGrammarBatch, type GrammarResult, type GrammarSlug } from "./grammar-lessons";

export type GrammarBatchProgress = { batchIndex: number; answers: string[]; results: GrammarResult[] };
type SavedItem = { answer: string; result: GrammarResult };
type Row = { batch_index: number; answers: unknown };
function toProgress(row: Row): GrammarBatchProgress {
  if (!Array.isArray(row.answers) || row.answers.length !== 5 || row.answers.some((item) =>
    !item || typeof item !== "object" || typeof item.answer !== "string" || !item.result ||
    !["correct", "incorrect", "review"].includes(item.result.status))) throw new Error("Saved grammar progress is invalid.");
  const items = row.answers as SavedItem[];
  return { batchIndex: row.batch_index, answers: items.map((item) => item.answer), results: items.map((item) => item.result) };
}
export async function loadGrammarProgress(childId: string, slug: GrammarSlug): Promise<GrammarBatchProgress[]> {
  const { data, error } = await adminClient().from("grammar_batch_progress").select("batch_index,answers")
    .eq("child_id", childId).eq("lesson_slug", slug).eq("content_version", GRAMMAR_LESSONS[slug].version).order("batch_index");
  if (error) throw error;
  return (data ?? []).map((row) => toProgress(row as Row));
}
export async function saveGrammarProgress(childId: string, slug: GrammarSlug, batchIndex: number, answers: string[]): Promise<GrammarBatchProgress> {
  const results = await gradeGrammarBatch(slug, batchIndex, answers);
  const stored = answers.map((answer, index) => ({ answer, result: results[index] }));
  const { error } = await adminClient().from("grammar_batch_progress").upsert({
    child_id: childId, lesson_slug: slug, content_version: GRAMMAR_LESSONS[slug].version, batch_index: batchIndex,
    answers: stored, updated_at: new Date().toISOString(),
  }, { onConflict: "child_id,lesson_slug,content_version,batch_index" });
  if (error) throw error;
  return { batchIndex, answers, results };
}
export async function clearGrammarProgress(childId: string, slug: GrammarSlug): Promise<void> {
  const { error } = await adminClient().from("grammar_batch_progress").delete()
    .eq("child_id", childId).eq("lesson_slug", slug).eq("content_version", GRAMMAR_LESSONS[slug].version);
  if (error) throw error;
}
