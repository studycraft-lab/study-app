import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { TutorError } from "./http";

export async function reserveSectionQuestion(childId: string, progressId: string) {
  const { error } = await adminClient().rpc("reserve_tutor_text_question", { p_child_id: childId, p_progress_id: progressId });
  if (!error) return;
  if (error.message.includes("Too many questions")) throw new TutorError("Please wait a minute before asking another question.", 429);
  if (error.message.includes("Daily question allowance")) throw new TutorError("You've reached today's question limit. Come back tomorrow.", 429);
  if (error.message.includes("unavailable")) throw new TutorError("This lesson is unavailable.", 404);
  throw new TutorError("Typed tutor questions are temporarily unavailable.", 503);
}
