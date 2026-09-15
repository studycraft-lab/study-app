import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { getActiveChild } from "@/lib/family/store";
import { loadProgress, type TutorChild } from "../progress-store";
import { TutorError } from "../http";
import { voiceConfig } from "./config";
export type VoiceSession = { id: string; child_id: string; progress_id: string; client_token: string; ui_revision: number; status: "reserved" | "active" | "termination_pending" | "ended" | "failed"; provider_call_id: string | null; deadline: string; model: string; created_at: string };
export async function voicePermission(familyId: string) {
  const { data, error } = await adminClient().from("tutor_voice_settings").select("enabled").eq("family_id", familyId).maybeSingle();
  if (error) throw error; return data?.enabled === true;
}
export async function setVoicePermission(familyId: string, enabled: boolean) {
  const { error } = await adminClient().from("tutor_voice_settings").upsert({ family_id: familyId, enabled, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function reserveVoiceSession(child: TutorChild, progressId: string, clientToken: string) {
  await loadProgress(child, progressId);
  const config = voiceConfig();
  const { data, error } = await adminClient().rpc("reserve_tutor_voice", { p_child_id: child.id, p_progress_id: progressId, p_model: config.model, p_session_seconds: config.sessionSeconds, p_daily_seconds: config.dailySeconds, p_starts_per_minute: config.startsPerMinute, p_client_token: clientToken });
  if (error) throw new TutorError(/Parent/.test(error.message) ? "Your parent has not enabled live voice." : /allowance|active|starts/.test(error.message) ? error.message : "Live lesson unavailable.", /allowance|active|starts/.test(error.message) ? 429 : 403);
  return data as VoiceSession;
}
export async function voiceContext(id: string) {
  const { data, error } = await adminClient().from("tutor_voice_sessions").select("*").eq("id", id).maybeSingle();
  if (error || !data) throw new TutorError("Voice session unavailable.", 404);
  const session = data as VoiceSession; const child = await getActiveChild(session.child_id);
  if (!child || !await voicePermission(child.familyId)) throw new TutorError("Live voice permission is unavailable.", 403);
  const loaded = await loadProgress(child, session.progress_id);
  return { ...loaded, child, session };
}
export async function updateVoice(id: string, values: { status?: VoiceSession["status"]; provider_call_id?: string; ended_at?: string; error_class?: string | null; provider_usage?: { total_tokens: number; measured: true } | null }) {
  const { error } = await adminClient().from("tutor_voice_sessions").update(values).eq("id", id);
  if (error) throw error;
}
export async function activeVoiceSessions(childId?: string) {
  let query = adminClient().from("tutor_voice_sessions").select("*").in("status", ["reserved", "active", "termination_pending"]);
  if (childId) query = query.eq("child_id", childId);
  const { data, error } = await query;
  if (error) throw error; return (data ?? []) as VoiceSession[];
}

export async function acknowledgeVoice(childId: string, token: string, revision: number) {
  const { error } = await adminClient().rpc("ack_tutor_voice",{ p_child_id: childId,p_client_token: token,p_revision: revision });
  if (error) throw new TutorError("Voice acknowledgement unavailable.",409);
}
