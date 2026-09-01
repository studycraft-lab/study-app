import "server-only";

import { createHash } from "node:crypto";

import type { ChildProfile } from "@/lib/family/store";
import { adminClient } from "@/lib/supabase/admin";
import { validateQuestionBank } from "./validate";

type ChildContext = ChildProfile & { familyId: string };
type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as RecordValue : {};
}

function records(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

export async function reportQuestion(input: { child: ChildContext; attemptId: string; note?: string }) {
  const client = adminClient();
  const { data: attempt, error: attemptError } = await client.from("study_attempts")
    .select("id,question_bank_id,bank_version,question_id,question_version")
    .eq("id", input.attemptId).eq("child_id", input.child.id).single();
  if (attemptError || !attempt) throw new Error("That answer attempt is unavailable.");
  const { data: bank, error: bankError } = await client.from("question_banks").select("payload").eq("id", attempt.question_bank_id).single();
  if (bankError || !bank) throw new Error("The question bank is unavailable.");
  const snapshot = records(record(bank.payload).questions).find((item) => item.id === attempt.question_id);
  if (!snapshot) throw new Error("The reported question is unavailable.");
  const { data, error } = await client.from("question_reports").upsert({
    attempt_id: attempt.id,
    family_id: input.child.familyId,
    child_id: input.child.id,
    reporter_name: input.child.displayName,
    question_bank_id: attempt.question_bank_id,
    bank_version: attempt.bank_version,
    question_id: attempt.question_id,
    question_version: attempt.question_version,
    question_snapshot: snapshot,
    note: input.note?.trim() || null,
    status: "open",
    resolved_at: null,
    resolved_question_bank_id: null,
    resolver_name: null,
    resolution_note: null,
    replacement_snapshot: null,
  }, { onConflict: "attempt_id" }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "The report could not be saved.");
  return String(data.id);
}

export async function listQuestionReports(familyId: string) {
  const client = adminClient();
  const { data: reportRows, error: reportError } = await client.from("question_reports")
    .select("id,attempt_id,reporter_name,question_bank_id,bank_version,question_id,question_version,question_snapshot,note,status,created_at,resolved_at,resolver_name,resolution_note,resolved_question_bank_id,replacement_snapshot")
    .eq("family_id", familyId).order("created_at", { ascending: false }).limit(100);
  if (reportError) throw new Error(reportError.message);
  const rows = reportRows ?? [];
  const attemptIds = rows.map((item) => item.attempt_id);
  const bankIds = [...new Set(rows.map((item) => item.question_bank_id))];
  const [{ data: attemptRows, error: attemptError }, { data: bankRows, error: bankError }] = await Promise.all([
    attemptIds.length ? client.from("study_attempts").select("id,response,correct,earned_marks,max_marks,feedback,attempted_at").in("id", attemptIds) : Promise.resolve({ data: [], error: null }),
    bankIds.length ? client.from("question_banks").select("id,payload").in("id", bankIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (attemptError || bankError) throw new Error(attemptError?.message ?? bankError?.message ?? "Report context is unavailable.");
  const attemptById = new Map((attemptRows ?? []).map((item) => [item.id, item]));
  const bankById = new Map((bankRows ?? []).map((item) => [item.id, record(item.payload)]));
  const groups = new Map<string, RecordValue>();
  rows.forEach((row) => {
    const key = [row.question_bank_id, row.question_id, row.question_version, row.status].join(":");
    const bank = bankById.get(row.question_bank_id) ?? {};
    const metadata = record(bank.bank);
    const attempt = attemptById.get(row.attempt_id);
    const existing = groups.get(key) ?? {
      id: row.id,
      status: row.status,
      questionBankId: row.question_bank_id,
      bankVersion: row.bank_version,
      questionId: row.question_id,
      questionVersion: row.question_version,
      questionSnapshot: row.question_snapshot,
      chapter: { title: metadata.title ?? "Chapter", subject: metadata.subject ?? "Subject", grade: metadata.grade, board: metadata.board },
      reporters: [],
      attempts: [],
      createdAt: row.created_at,
      resolution: row.status === "open" ? null : { resolvedAt: row.resolved_at, resolverName: row.resolver_name, note: row.resolution_note, replacementBankId: row.resolved_question_bank_id, replacementSnapshot: row.replacement_snapshot },
    };
    const reporters = existing.reporters as string[];
    if (!reporters.includes(row.reporter_name)) reporters.push(row.reporter_name);
    (existing.attempts as unknown[]).push({
      reportId: row.id, reporterName: row.reporter_name, note: row.note, response: attempt?.response,
      correct: attempt?.correct, earnedMarks: attempt?.earned_marks, maxMarks: attempt?.max_marks,
      feedback: attempt?.feedback, attemptedAt: attempt?.attempted_at,
    });
    groups.set(key, existing);
  });
  const values: RecordValue[] = [...groups.values()].map((group) => Object.assign({}, group, { reportCount: (group.attempts as unknown[]).length }));
  return { open: values.filter((group) => group.status === "open"), resolved: values.filter((group) => group.status !== "open") };
}

async function resolveGroup(input: { reportId: string; familyId: string; resolverName: string; status: "dismissed" | "disabled" | "corrected"; note?: string; replacementBankId?: string; replacementSnapshot?: RecordValue }) {
  const client = adminClient();
  const { data: report, error } = await client.from("question_reports").select("question_bank_id,question_id,question_version")
    .eq("id", input.reportId).eq("family_id", input.familyId).eq("status", "open").single();
  if (error || !report) throw new Error("This report is no longer open.");
  const { error: updateError } = await client.from("question_reports").update({
    status: input.status, resolved_at: new Date().toISOString(), resolver_name: input.resolverName,
    resolution_note: input.note?.trim() || null, resolved_question_bank_id: input.replacementBankId ?? null,
    replacement_snapshot: input.replacementSnapshot ?? null,
  }).eq("family_id", input.familyId).eq("question_bank_id", report.question_bank_id)
    .eq("question_id", report.question_id).eq("question_version", report.question_version).eq("status", "open");
  if (updateError) throw new Error(updateError.message);
  return report;
}

export async function dismissQuestionReport(input: { reportId: string; familyId: string; resolverName: string; note?: string }) {
  await resolveGroup({ ...input, status: "dismissed" });
}

export async function reviseReportedQuestion(input: { reportId: string; familyId: string; resolverName: string; action: "disable" | "correct"; patchedQuestion?: unknown; note?: string }) {
  const client = adminClient();
  const { data: report, error: reportError } = await client.from("question_reports")
    .select("id,question_bank_id,question_id,question_version").eq("id", input.reportId).eq("family_id", input.familyId).eq("status", "open").single();
  if (reportError || !report) throw new Error("This report is no longer open.");
  const { data: reportedBank, error: bankError } = await client.from("question_banks")
    .select("external_id,version,payload").eq("id", report.question_bank_id).single();
  if (bankError || !reportedBank) throw new Error("The reported question bank is unavailable.");
  const { data: latestBanks, error: latestError } = await client.from("question_banks").select("id,version,payload")
    .eq("external_id", reportedBank.external_id).order("version", { ascending: false }).limit(1);
  if (latestError || !latestBanks?.[0]) throw new Error(latestError?.message ?? "The latest question bank is unavailable.");
  const latestBank = latestBanks[0];

  const payload = structuredClone(record(latestBank.payload));
  const questions = records(payload.questions);
  const index = questions.findIndex((item) => item.id === report.question_id);
  if (index < 0) throw new Error("The reported question is unavailable.");
  const current = questions[index];
  const replacement = input.action === "disable"
    ? { ...current, status: "disabled", version: Number(current.version ?? report.question_version) + 1 }
    : { ...record(input.patchedQuestion), id: report.question_id, status: "active", version: Number(current.version ?? report.question_version) + 1 };
  questions[index] = replacement;
  payload.questions = questions;
  const bankMetadata = record(payload.bank);
  bankMetadata.version = Number(latestBank.version) + 1;
  bankMetadata.status = "draft";
  payload.bank = bankMetadata;

  const validation = validateQuestionBank(payload);
  if (!validation.valid || !validation.value || !validation.preview) throw new Error(validation.errors.join(" ") || "The corrected question is invalid.");
  const contentHash = createHash("sha256").update(JSON.stringify(validation.value)).digest("hex");
  const preview = validation.preview;
  const { data: imported, error: importError } = await client.rpc("import_question_bank", {
    p_payload: validation.value,
    p_metadata: { board: preview.board, grade: preview.grade, subject: preview.subject, bookTitle: preview.bookTitle, chapterNumber: preview.chapterNumber, chapterTitle: preview.chapterTitle },
    p_content_hash: contentHash,
  });
  if (importError) throw new Error(importError.message);
  const newBankId = String(record(imported).id ?? "");
  if (!newBankId) throw new Error("The corrected bank could not be created.");

  const [bankUpdate, reviewDelete, latestReviewDelete, reportUpdate] = await Promise.all([
    client.from("question_banks").update({ status: "superseded" }).eq("id", latestBank.id),
    client.from("review_items").delete().eq("question_bank_id", report.question_bank_id).eq("question_id", report.question_id),
    client.from("review_items").delete().eq("question_bank_id", latestBank.id).eq("question_id", report.question_id),
    resolveGroup({ reportId: report.id, familyId: input.familyId, resolverName: input.resolverName, status: input.action === "disable" ? "disabled" : "corrected", note: input.note, replacementBankId: newBankId, replacementSnapshot: replacement }).then(() => ({ error: null as null | { message: string } })).catch((error: Error) => ({ error: { message: error.message } })),
  ]);
  const updateError = bankUpdate.error ?? reviewDelete.error ?? latestReviewDelete.error ?? reportUpdate.error;
  if (updateError) throw new Error(updateError.message);
  return { bankId: newBankId, bankVersion: Number(bankMetadata.version) };
}
