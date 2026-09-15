import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { checkedPack } from "./content-store";
import { TutorError } from "./http";
import { applyTutorCommand, initialTutorState, type TutorState } from "./state";
export type TutorChild = { id: string; familyId: string; board: string; grade: number };
export type ProgressRow = { id: string; pack_id: string; child_id: string; revision: number; state: TutorState };
export async function childPack(child: TutorChild, packId: string, pinned = false) {
  const { data, error } = await adminClient().from("tutor_library").select("id,payload,status").eq("id", packId).eq("family_id", child.familyId).ilike("board", child.board).eq("grade", child.grade).maybeSingle();
  if (error) throw error;
  if (!data || (!pinned && data.status !== "published")) throw new TutorError("This lesson is unavailable. Ask your parent for help.", 404);
  if (data.status === "draft") throw new TutorError("This lesson is not published.", 404);
  return checkedPack(data.payload);
}
export async function loadProgress(child: TutorChild, id: string) {
  const { data, error } = await adminClient().from("tutor_progress").select("*").eq("id", id).eq("child_id", child.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new TutorError("Saved lesson unavailable.", 404);
  const progress = data as ProgressRow;
  return { progress, pack: await childPack(child, progress.pack_id, true) };
}
export async function startProgress(child: TutorChild, packId: string) {
  const { data, error } = await adminClient().rpc("start_tutor_progress", { p_child_id: child.id, p_pack_id: packId, p_initial_state: initialTutorState() });
  if (error) throw new TutorError("This lesson is unavailable to start or resume.", 404);
  return resumeProgress(child, (data as ProgressRow).id);
}
export async function commandProgress(child: TutorChild, id: string, command: unknown) {
  const { progress, pack } = await loadProgress(child, id);
  const state = applyTutorCommand(pack, progress.state, command);
  if (state === progress.state) return { progress, pack };
  const { data, error } = await adminClient().rpc("save_tutor_progress", { p_child_id: child.id, p_id: id, p_revision: progress.revision, p_state: state });
  if (error) throw new TutorError("Progress changed. Resume the current step.", 409);
  return { progress: data as ProgressRow, pack };
}

export async function resumeProgress(child: TutorChild, id: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const loaded = await loadProgress(child, id);
    const state = loaded.progress.state;
    try {
      return await commandProgress(child, id, { name: "resume", callId: crypto.randomUUID(), revision: state.revision, stepId: loaded.pack.steps[state.stepIndex].id });
    } catch (error) {
      if (attempt === 2 || !(error instanceof TutorError && error.status === 409) && !(error instanceof Error && error.message.includes("lesson has changed"))) throw error;
    }
  }
  throw new TutorError("Could not resume. Try again.", 409);
}
