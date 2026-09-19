import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { tutorChapters } from "./content-store";
import { TutorError } from "./http";
import type { TutorChild } from "./progress-store";
export type TutorChapter = { id: string; title: string; courses: { board: string; grade: number; subject: string } };
export type TutorSection = { id: string; chapter_id: string; heading: string; external_id: string; printed_pages: string[] };
export type TutorRequest = { id: string; child_id: string; chapter_id: string; section_id: string | null; proposed_heading: string; page_reference: string; note: string; status: "requested" | "preparing" | "ready" | "declined"; reason: string; pack_id: string | null; available: boolean; child_profiles?: { display_name: string } };
export type AvailableLesson = { id: string; section_id: string; chapter_id: string; heading: string; chapter_title: string; content_version: number };
export async function tutorRequestLibrary(familyId: string, child?: TutorChild) {
  const all = await tutorChapters(familyId) as unknown as TutorChapter[];
  const chapters = child ? all.filter(ch => ch.courses.board.toLowerCase() === child.board.toLowerCase() && ch.courses.grade === child.grade) : all;
  const ids = chapters.map(ch => ch.id);
  const client = adminClient();
  let requestQuery = client.from("tutor_requests").select(child ? "*" : "*,child_profiles(display_name)").eq("family_id", familyId).order("created_at", { ascending: false });
  if (child) requestQuery = requestQuery.eq("child_id", child.id);
  const [sectionResult, packResult, requestResult, progressResult] = await Promise.all([
    ids.length ? client.from("tutor_sections").select("id,chapter_id,heading,external_id,printed_pages").in("chapter_id", ids) : Promise.resolve({ data: [], error: null }),
    ids.length ? client.from("tutor_library").select("id,section_id,chapter_id,heading,chapter_title,content_version,status").eq("family_id", familyId).in("chapter_id", ids) : Promise.resolve({ data: [], error: null }),
    requestQuery,
    child ? client.from("tutor_progress").select("id,pack_id,state").eq("child_id", child.id).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
  ]);
  if (sectionResult.error || packResult.error || requestResult.error || progressResult.error) throw new Error("Request library unavailable.");
  const allPacks = (packResult.data ?? []) as (AvailableLesson & { status: string })[];
  const lessons = allPacks.filter(p => p.status === "published");
  const progress = (progressResult.data ?? []).flatMap(row => { const pack = allPacks.find(p => p.id === row.pack_id && p.status !== "draft"); return pack ? [{ id: String(row.id), pack_id: pack.id, chapter_id: pack.chapter_id, chapter_title: pack.chapter_title, heading: pack.heading, completed: row.state?.phase === "completed" }] : []; });
  const requests = (requestResult.data ?? []) as unknown as TutorRequest[];
  return { chapters, progress, sections: (sectionResult.data ?? []) as TutorSection[], lessons, requests: requests.map(r => ({ ...r, available: r.status === "ready" && lessons.some(p => p.id === r.pack_id && p.section_id === r.section_id && p.chapter_id === r.chapter_id) })) };
}
function requestError(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "23505") throw new TutorError("There is already an active request for that section.", 409);
  if (/unavailable|eligible/.test(error.message)) throw new TutorError("That chapter, section or request is unavailable for this child.", 404);
  if (/Map |Choose |reason|declined|details|key/.test(error.message)) throw new TutorError(error.message, 422);
  throw new Error("Request action failed.");
}
export async function requestSection(child: TutorChild, input: { chapterId: string; sectionId: string | null; heading: string; page: string; note: string }) {
  const { data, error } = await adminClient().rpc("request_tutor_section", { p_child_id: child.id, p_chapter_id: input.chapterId, p_section_id: input.sectionId, p_heading: input.heading, p_page: input.page, p_note: input.note });
  requestError(error); return data as string;
}
export async function catalogueSection(familyId: string, input: { chapterId: string; key: string; heading: string; pages: string[] }) {
  const { data, error } = await adminClient().rpc("catalogue_tutor_section", { p_family_id: familyId, p_chapter_id: input.chapterId, p_key: input.key, p_heading: input.heading, p_pages: input.pages });
  requestError(error); return data as string;
}
export async function manageRequest(familyId: string, input: { id: string; action: string; sectionId: string | null; packId: string | null; reason: string }) {
  const { error } = await adminClient().rpc("manage_tutor_request", { p_family_id: familyId, p_request_id: input.id, p_action: input.action, p_section_id: input.sectionId, p_pack_id: input.packId, p_reason: input.reason });
  requestError(error);
}
