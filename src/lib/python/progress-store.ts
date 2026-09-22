import "server-only";

import { adminClient } from "@/lib/supabase/admin";

export type PythonProgressEntry = { questionId: string; answer: string; checked: boolean; passed: boolean };

type Row = { question_id: string; answer: string; checked: boolean; passed: boolean };
function entry(row: Row): PythonProgressEntry {
  return { questionId: row.question_id, answer: row.answer, checked: row.checked, passed: row.passed };
}

export async function loadPythonProgress(childId: string): Promise<PythonProgressEntry[]> {
  const { data, error } = await adminClient().from("python_practice_answers")
    .select("question_id,answer,checked,passed").eq("child_id", childId);
  if (error) throw error;
  return (data ?? []).map((row) => entry(row as Row));
}

export async function savePythonProgress(childId: string, item: PythonProgressEntry): Promise<PythonProgressEntry> {
  const { data, error } = await adminClient().from("python_practice_answers").upsert({
    child_id: childId,
    question_id: item.questionId,
    answer: item.answer,
    checked: item.checked,
    passed: item.passed,
    updated_at: new Date().toISOString(),
  }, { onConflict: "child_id,question_id" }).select("question_id,answer,checked,passed").single();
  if (error) throw error;
  return entry(data as Row);
}

export async function deletePythonProgress(childId: string, questionId: string): Promise<void> {
  const { error } = await adminClient().from("python_practice_answers")
    .delete().eq("child_id", childId).eq("question_id", questionId);
  if (error) throw error;
}
