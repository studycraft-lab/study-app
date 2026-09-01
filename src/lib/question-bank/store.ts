import "server-only";

import { createHash } from "node:crypto";

import type { BankMetadata, ValidatedQuestionBank } from "./validate";
import { adminClient } from "@/lib/supabase/admin";

export type LibraryFilter = { familyId: string; board?: string; grade?: number };
export type ImportQuestionBankResult = { id: string; created: boolean; replaced: boolean };

export async function importQuestionBank(bank: ValidatedQuestionBank, metadata: BankMetadata) {
  const contentHash = createHash("sha256").update(JSON.stringify(bank)).digest("hex");
  const { data, error } = await adminClient().rpc("import_question_bank", {
    p_payload: bank,
    p_metadata: metadata,
    p_content_hash: contentHash,
  });
  if (error) throw new Error(error.message);
  return data as ImportQuestionBankResult;
}

export async function listLibrary(filter?: LibraryFilter) {
  let query = adminClient()
    .from("library_chapters")
    .select("id,board,grade,subject,book_title,chapter_number,chapter_title,bank_version,question_count,imported_at")
    .order("imported_at", { ascending: false });
  if (filter) query = query.eq("family_id", filter.familyId);
  if (filter?.board) query = query.ilike("board", filter.board);
  if (filter?.grade) query = query.eq("grade", filter.grade);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    board: row.board,
    grade: row.grade,
    subject: row.subject,
    bookTitle: row.book_title,
    chapterNumber: row.chapter_number,
    chapterTitle: row.chapter_title,
    bankVersion: row.bank_version,
    questionCount: row.question_count,
    importedAt: row.imported_at,
  }));
}

export async function getQuestionBank(id: string): Promise<Record<string, unknown>> {
  const { data, error } = await adminClient().from("question_banks").select("payload").eq("id", id).single();
  if (error || typeof data?.payload !== "object" || data.payload === null) throw new Error("Question bank is unavailable.");
  return data.payload as Record<string, unknown>;
}

export async function getQuestionBankForChild(id: string, filter: LibraryFilter): Promise<Record<string, unknown>> {
  const { data: visible, error: visibleError } = await adminClient().from("library_chapters").select("id")
    .eq("id", id).eq("family_id", filter.familyId).ilike("board", filter.board ?? "").eq("grade", filter.grade ?? 0).maybeSingle();
  if (visibleError || !visible) throw new Error("Question bank is unavailable for this child.");
  return getQuestionBank(id);
}
