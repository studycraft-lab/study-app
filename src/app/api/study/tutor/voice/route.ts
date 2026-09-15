import { childFromRequest } from "@/lib/family/request";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
import { voiceUnavailableReason, voiceConfig } from "@/lib/tutor/voice/config";
import { acknowledgeVoice, activeVoiceSessions, reserveVoiceSession, updateVoice, voicePermission } from "@/lib/tutor/voice/store";
import { controllerRequest } from "@/lib/tutor/voice/controller-client";
async function child(request: Request) { const profile = await childFromRequest(request); if (!profile) throw new TutorError("Child sign-in required.",401); return profile; }
export async function GET(request: Request) {
  try {
    const profile = await child(request); const reason = voiceUnavailableReason();
    const allowed = !reason && await voicePermission(profile.familyId);
    return Response.json({ available: !!allowed, reason: reason ?? (allowed ? null : "Your parent has not enabled live voice."), sessionSeconds: voiceConfig().sessionSeconds }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return tutorError(error); }
}
export async function POST(request: Request) {
  try {
    const profile = await child(request); requireTutorEnabled(); const reason = voiceUnavailableReason(); if (reason) throw new TutorError(reason,503);
    const body = await readTutorJSON(request, 110000);
    if (!uuid(body.clientToken) || !uuid(body.progressId) || typeof body.sdp !== "string" || !body.sdp.startsWith("v=0") || body.sdp.length > 100000) throw new TutorError("Invalid voice setup.");
    const health = await controllerRequest("/health");
    if (health.protocol !== "studycraft-voice-v1" || health.independentDeadlines !== true) throw new TutorError("Voice controls are unavailable.",503);
    const session = await reserveVoiceSession(profile, body.progressId, body.clientToken);
    try {
      const connected = await controllerRequest("/calls", { voiceId: session.id, sdp: body.sdp });
      return Response.json({ voiceId: session.id, sdp: connected.sdp, deadline: session.deadline });
    } catch (error) {
      // The remote create could have succeeded. Keep the slot occupied for controller reconciliation.
      await updateVoice(session.id, { status: "termination_pending", error_class: "setup_unconfirmed" });
      throw error;
    }
  } catch (error) { return tutorError(error); }
}
export async function DELETE(request: Request) {
  try {
    const profile = await child(request); const body = await readTutorJSON(request,1024);
    if (!uuid(body.clientToken)) throw new TutorError("Invalid voice session.");
    for (const session of (await activeVoiceSessions(profile.id)).filter(s => s.client_token === body.clientToken)) {
      await updateVoice(session.id, { status: "termination_pending" });
      await controllerRequest("/end", { voiceId: session.id });
    }
    return Response.json({ ended: true });
  } catch (error) { return tutorError(error); }
}

export async function PATCH(request: Request) {
  try {
    const profile = await child(request); const body = await readTutorJSON(request,1024);
    if (!uuid(body.clientToken) || !Number.isSafeInteger(body.revision) || Number(body.revision)<0 || Number(body.revision)>1000000) throw new TutorError("Invalid voice acknowledgement.");
    await acknowledgeVoice(profile.id,body.clientToken,Number(body.revision));
    return Response.json({ acknowledged: true });
  } catch (error) { return tutorError(error); }
}
