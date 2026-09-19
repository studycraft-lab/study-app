import { isParentAuthorized } from "@/lib/parent-auth";
import { ensureFamily } from "@/lib/family/store";
import { preparationPrompt } from "@/lib/tutor/preparation";
import { requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
export async function GET(request: Request) {
  try {
    if (!isParentAuthorized(request)) throw new TutorError("Parent sign-in required.",401);
    requireTutorEnabled();
    const id = new URL(request.url).searchParams.get("requestId");
    if (!uuid(id)) throw new TutorError("Choose a request.",422);
    const family = await ensureFamily();
    return Response.json({prompt:await preparationPrompt(family.id,id)}, {headers:{"Cache-Control":"no-store"}});
  } catch(error) { return tutorError(error); }
}
