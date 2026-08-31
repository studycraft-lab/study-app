import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

import type { BankMetadata, ValidatedQuestionBank } from "./validate";

function adminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase import is not configured.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function importQuestionBank(bank: ValidatedQuestionBank, metadata: BankMetadata) {
  const contentHash = createHash("sha256").update(JSON.stringify(bank)).digest("hex");
  const { data, error } = await adminClient().rpc("import_question_bank", {
    p_payload: bank,
    p_metadata: metadata,
    p_content_hash: contentHash,
  });
  if (error) throw new Error(error.message);
  return data as { id: string; created: boolean };
}

export async function listLibrary() {
  const { data, error } = await adminClient()
    .from("library_chapters")
    .select("id,board,grade,subject,book_title,chapter_number,chapter_title,bank_version,question_count,imported_at")
    .order("imported_at", { ascending: false });
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
