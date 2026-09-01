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
  }, { onConflict: "attempt_id" }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "The report could not be saved.");
  return String(data.id);
}

export async function listOpenQuestionReports() {
  const { data, error } = await adminClient().from("question_reports")
    .select("id,attempt_id,reporter_name,question_bank_id,bank_version,question_id,question_version,question_snapshot,note,created_at")
    .eq("status", "open").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function dismissQuestionReport(reportId: string) {
  const { error } = await adminClient().from("question_reports").update({ status: "dismissed", resolved_at: new Date().toISOString() }).eq("id", reportId).eq("status", "open");
  if (error) throw new Error(error.message);
}

export async function patchReportedQuestion(reportId: string, patchedQuestion: unknown) {
  const client = adminClient();
  const { data: report, error: reportError } = await client.from("question_reports")
    .select("id,question_bank_id,question_id,question_version").eq("id", reportId).eq("status", "open").single();
  if (reportError || !report) throw new Error("This report is no longer open.");
  const { data: oldBank, error: bankError } = await client.from("question_banks")
    .select("external_id,version,payload").eq("id", report.question_bank_id).single();
  if (bankError || !oldBank) throw new Error("The reported question bank is unavailable.");

  const payload = structuredClone(record(oldBank.payload));
  const questions = records(payload.questions);
  const index = questions.findIndex((item) => item.id === report.question_id);
  if (index < 0) throw new Error("The reported question is unavailable.");
  const replacement = { ...record(patchedQuestion), id: report.question_id, version: report.question_version + 1 };
  questions[index] = replacement;
  payload.questions = questions;
  const bankMetadata = record(payload.bank);
  const { data: versions, error: versionError } = await client.from("question_banks").select("version").eq("external_id", oldBank.external_id).order("version", { ascending: false }).limit(1);
  if (versionError) throw new Error(versionError.message);
  bankMetadata.version = Number(versions?.[0]?.version ?? oldBank.version) + 1;
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

  const [bankUpdate, reviewDelete, reportUpdate] = await Promise.all([
    client.from("question_banks").update({ status: "superseded" }).eq("id", report.question_bank_id),
    client.from("review_items").delete().eq("question_bank_id", report.question_bank_id).eq("question_id", report.question_id),
    client.from("question_reports").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_question_bank_id: newBankId })
      .eq("question_bank_id", report.question_bank_id).eq("question_id", report.question_id).eq("status", "open"),
  ]);
  const updateError = bankUpdate.error ?? reviewDelete.error ?? reportUpdate.error;
  if (updateError) throw new Error(updateError.message);
  return { bankId: newBankId, bankVersion: Number(bankMetadata.version) };
}
