import { childFromRequest } from "@/lib/family/request";
import { requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
import { videoPlayback } from "@/lib/tutor/video-store";

export async function GET(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) throw new TutorError("Child sign-in required.", 401);
    requireTutorEnabled();
    const id = new URL(request.url).searchParams.get("id");
    if (!uuid(id)) throw new TutorError("Choose a video lesson.", 400);
    return Response.json(await videoPlayback(child.familyId, id, child), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return tutorError(error); }
}
