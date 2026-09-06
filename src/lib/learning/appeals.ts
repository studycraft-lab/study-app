import "server-only";

import type { ChildProfile } from "@/lib/family/store";
import { adminClient } from "@/lib/supabase/admin";

type ChildContext = ChildProfile & { familyId: string };
type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordValue : {};
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export async function createScoreAppeal(input: { child: ChildContext; attemptId: string; comment?: string }) {
  const client = adminClient();
  const { data: attempt, error: attemptError } = await client.from("study_attempts")
    .select("id,child_id,earned_marks,max_marks")
    .eq("id", input.attemptId).eq("child_id", input.child.id).maybeSingle();
  if (attemptError || !attempt) throw new Error("That answer attempt is unavailable.");

  const { data: existing, error: existingError } = await client.from("score_appeals")
    .select("id,status").eq("attempt_id", input.attemptId).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) {
    if (existing.status === "pending") {
      const { error } = await client.from("score_appeals").update({ child_comment: input.comment?.trim() || null })
        .eq("id", existing.id).eq("child_id", input.child.id);
      if (error) throw new Error(error.message);
    }
    return { id: String(existing.id), status: String(existing.status) };
  }

  const { data, error } = await client.from("score_appeals").insert({
    family_id: input.child.familyId,
    child_id: input.child.id,
    attempt_id: input.attemptId,
    child_comment: input.comment?.trim() || null,
    original_earned_marks: Number(attempt.earned_marks),
    original_max_marks: Number(attempt.max_marks),
  }).select("id,status").single();
  if (error || !data) throw new Error(error?.message ?? "The appeal could not be saved.");
  return { id: String(data.id), status: String(data.status) };
}

export async function listScoreAppeals(familyId: string) {
  const client = adminClient();
  const { data: appeals, error: appealError } = await client.from("score_appeals")
    .select("id,child_id,attempt_id,status,child_comment,original_earned_marks,original_max_marks,resolved_earned_marks,resolver_name,parent_comment,created_at,resolved_at")
    .eq("family_id", familyId).order("created_at", { ascending: false }).limit(100);
  if (appealError) throw new Error(appealError.message);
  const rows = appeals ?? [];
  if (!rows.length) return { pending: [], resolved: [] };

  const attemptIds = rows.map((row) => String(row.attempt_id));
  const childIds = [...new Set(rows.map((row) => String(row.child_id)))];
  const [{ data: attempts, error: attemptError }, { data: children, error: childError }] = await Promise.all([
    client.from("study_attempts").select("id,question_bank_id,question_id,question_prompt,response,correct,earned_marks,max_marks,feedback,grading_status,attempted_at").in("id", attemptIds),
    client.from("child_profiles").select("id,display_name").in("id", childIds),
  ]);
  if (attemptError || childError) throw new Error(attemptError?.message ?? childError?.message ?? "Appeal context is unavailable.");
  const attemptById = new Map((attempts ?? []).map((attempt) => [String(attempt.id), attempt]));
  const childById = new Map((children ?? []).map((child) => [String(child.id), String(child.display_name)]));
  const bankIds = [...new Set((attempts ?? []).map((attempt) => String(attempt.question_bank_id)))];
  const { data: banks, error: bankError } = bankIds.length
    ? await client.from("question_banks").select("id,payload").in("id", bankIds)
    : { data: [], error: null };
  if (bankError) throw new Error(bankError.message);
  const bankById = new Map((banks ?? []).map((bank) => [String(bank.id), record(bank.payload)]));

  const values = rows.map((appeal) => {
    const attempt = attemptById.get(String(appeal.attempt_id));
    const bank = bankById.get(String(attempt?.question_bank_id)) ?? {};
    const bankMetadata = record(bank.bank);
    const question = records(bank.questions).find((item) => item.id === attempt?.question_id) ?? {};
    const sourceIds = new Set(records(question.sourceRefs).map((ref) => ref.pageId));
    const sourcePages = records(bank.sources).filter((source) => sourceIds.has(source.id))
      .map((source) => Number(source.pageNumber)).filter(Number.isFinite);
    return {
      id: String(appeal.id), status: String(appeal.status), childName: childById.get(String(appeal.child_id)) ?? "Child",
      childComment: appeal.child_comment, createdAt: appeal.created_at, resolvedAt: appeal.resolved_at,
      originalEarnedMarks: Number(appeal.original_earned_marks), maxMarks: Number(appeal.original_max_marks),
      resolvedEarnedMarks: appeal.resolved_earned_marks === null ? null : Number(appeal.resolved_earned_marks),
      resolverName: appeal.resolver_name, parentComment: appeal.parent_comment,
      subject: String(bankMetadata.subject ?? "Subject"), chapterTitle: String(bankMetadata.title ?? "Chapter"),
      question: String(attempt?.question_prompt ?? question.prompt ?? "Question unavailable"),
      childAnswer: attempt?.response, expectedAnswer: record(attempt?.feedback).expectedAnswer,
      explanation: record(attempt?.feedback).explanation, rubric: question.rubric ?? null,
      sourcePages, gradingMeta: record(attempt?.feedback).gradingMeta ?? null,
      gradingPending: attempt?.grading_status === "pending_review",
    };
  });
  return { pending: values.filter((value) => value.status === "pending"), resolved: values.filter((value) => value.status !== "pending") };
}

export async function resolveScoreAppeal(input: { appealId: string; familyId: string; resolverName: string; earnedMarks: number; comment?: string }) {
  const { data, error } = await adminClient().rpc("resolve_score_appeal", {
    p_appeal_id: input.appealId,
    p_family_id: input.familyId,
    p_resolver_name: input.resolverName,
    p_earned_marks: input.earnedMarks,
    p_parent_comment: input.comment?.trim() ?? "",
  });
  if (error) throw new Error(error.message);
  return record(data);
}
