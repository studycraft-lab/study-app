import { isParentAuthorized } from "@/lib/parent-auth";
import { ensureFamily } from "@/lib/family/store";
import { readTutorJSON, TutorError, tutorError } from "@/lib/tutor/http";
import { voicePermission, setVoicePermission } from "@/lib/tutor/voice/store";
import { voiceUnavailableReason, voiceConfig } from "@/lib/tutor/voice/config";
async function parent(request: Request) { if (!isParentAuthorized(request)) throw new TutorError("Parent sign-in required.",401); return ensureFamily(); }
export async function GET(request: Request) {
  try { const family = await parent(request); return Response.json({ enabled: await voicePermission(family.id), reason: voiceUnavailableReason(), limits: voiceConfig() }); } catch (error) { return tutorError(error); }
}
export async function PATCH(request: Request) {
  try { const family = await parent(request); const body = await readTutorJSON(request,1024); if (typeof body.enabled !== "boolean") throw new TutorError("Choose whether to allow live tutoring."); await setVoicePermission(family.id,body.enabled); return Response.json({ updated: true }); } catch (error) { return tutorError(error); }
}
