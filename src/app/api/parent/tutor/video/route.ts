import { isParentAuthorized } from "@/lib/parent-auth";
import { ensureFamily } from "@/lib/family/store";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
import { setVideoStatus, videoLessons, videoPlayback } from "@/lib/tutor/video-store";

async function parent(request: Request) {
  if (!isParentAuthorized(request)) throw new TutorError("Parent sign-in required.", 401);
  requireTutorEnabled();
  return ensureFamily();
}
export async function GET(request: Request) {
  try {
    const family = await parent(request);
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null && !uuid(id)) throw new TutorError("Choose a video lesson.", 400);
    const data = id ? await videoPlayback(family.id, id) : { videos: await videoLessons(family.id) };
    return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return tutorError(error); }
}
export async function PATCH(request: Request) {
  try {
    const family = await parent(request);
    const body = await readTutorJSON(request, 1024);
    if (!uuid(body.id) || body.status !== "published" && body.status !== "archived") throw new TutorError("Choose a video and publication status.");
    await setVideoStatus(family.id, body.id, body.status);
    return Response.json({ updated: true });
  } catch (error) { return tutorError(error); }
}
