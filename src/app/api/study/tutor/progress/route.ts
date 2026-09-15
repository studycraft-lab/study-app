import { childFromRequest } from "@/lib/family/request";
import { commandProgress, loadProgress, resumeProgress, startProgress } from "@/lib/tutor/progress-store";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
import { TransitionError } from "@/lib/tutor/state";
async function child(request: Request) {
  const profile = await childFromRequest(request);
  if (!profile) throw new TutorError("Child sign-in required.", 401);
  requireTutorEnabled(); return profile;
}
export async function GET(request: Request) {
  try {
    const profile = await child(request); const id = new URL(request.url).searchParams.get("id");
    if (!uuid(id)) throw new TutorError("Choose a saved lesson.");
    return Response.json(await loadProgress(profile, id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return tutorError(error); }
}
export async function POST(request: Request) {
  try {
    const profile = await child(request); const body = await readTutorJSON(request, 2048);
    if (uuid(body.resumeId)) return Response.json(await resumeProgress(profile, body.resumeId));
    if (!uuid(body.packId)) throw new TutorError("Choose a lesson.");
    return Response.json(await startProgress(profile, body.packId));
  } catch (error) { return tutorError(error); }
}
export async function PATCH(request: Request) {
  try {
    const profile = await child(request); const body = await readTutorJSON(request, 4096);
    if (!uuid(body.id)) throw new TutorError("Choose a saved lesson.");
    return Response.json(await commandProgress(profile, body.id, body.command));
  } catch (error) { return tutorError(error instanceof TransitionError ? new TutorError(error.message, 409) : error); }
}
