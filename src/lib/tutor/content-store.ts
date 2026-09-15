import "server-only";
import { createHash } from "node:crypto";
import { adminClient } from "@/lib/supabase/admin";
import { canonicalPackJSON, validateLessonPack } from "./validate";
import type { LessonPack } from "./types";
import { TutorError } from "./http";
export type TutorPackRow = { id: string; section_id: string; chapter_id: string; heading: string; chapter_title: string; board: string; grade: number; status: "draft" | "published" | "archived"; content_version: number; content_hash: string; payload: LessonPack; previewed_at: string | null };
export async function tutorChapters(familyId: string) {
  const { data, error } = await adminClient().from("chapters").select("id,title,courses!inner(board,grade,subject,family_id)").eq("courses.family_id", familyId).order("title");
  if (error) throw error;
  return data ?? [];
}
export async function parentTutorPacks(familyId: string): Promise<TutorPackRow[]> {
  const { data, error } = await adminClient().from("tutor_library").select("*").eq("family_id", familyId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TutorPackRow[];
}
export async function importTutorPack(familyId: string, chapterId: string, pack: LessonPack) {
  const { data, error } = await adminClient().rpc("import_tutor_pack", { p_family_id: familyId, p_chapter_id: chapterId, p_payload: pack, p_content_hash: createHash("sha256").update(canonicalPackJSON(pack)).digest("hex") });
  if (error) {
    if (error.message.includes("Version collision")) throw new TutorError("This version has different content. Increase contentVersion.", 409);
    if (error.message.includes("Chapter unavailable")) throw new TutorError("Chapter unavailable.", 404);
    if (error.message.includes("does not match") || error.message.includes("Section heading")) throw new TutorError("Confirm the chapter and exact section mapping; the pack metadata differs.", 422);
    throw error;
  }
  return data as { id: string; created: boolean };
}
export async function manageTutorPack(familyId: string, id: string, action: "preview" | "publish" | "archive") {
  const { error } = await adminClient().rpc("manage_tutor_pack", { p_family_id: familyId, p_pack_id: id, p_action: action });
  if (error) {
    if (error.message.includes("Lesson unavailable")) throw new TutorError("Lesson unavailable.", 404);
    if (/Preview|Review|Archived/.test(error.message)) throw new TutorError(error.message, 409);
    throw error;
  }
}
export function checkedPack(payload: unknown): LessonPack {
  const validation = validateLessonPack(payload);
  if (!validation.valid) throw new TutorError("This stored lesson cannot be played. Ask your parent to import a valid version.", 422);
  return validation.pack;
}
