import { importRequestedPack, publishRequestedPack } from "@/lib/tutor/preparation";
import { isParentAuthorized } from "@/lib/parent-auth";
import { ensureFamily } from "@/lib/family/store";
import { importTutorPack, manageTutorPack, parentTutorPacks, tutorChapters } from "@/lib/tutor/content-store";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
import { validateLessonPack } from "@/lib/tutor/validate";
async function parent(request: Request) {
  if (!isParentAuthorized(request)) throw new TutorError("Parent sign-in required.", 401);
  requireTutorEnabled(); return ensureFamily();
}
export async function GET(request: Request) {
  try {
    const family = await parent(request);
    const [packs, chapters] = await Promise.all([parentTutorPacks(family.id), tutorChapters(family.id)]);
    return Response.json({ packs, chapters }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return tutorError(error); }
}
export async function POST(request: Request) {
  try {
    const family = await parent(request); const body = await readTutorJSON(request);
    const result = validateLessonPack(body.pack);
    if (!result.valid) return Response.json({ errors: result.errors }, { status: 422 });
    if (body.requestId !== undefined) {
      if (!uuid(body.requestId)) throw new TutorError("Choose a request.",422);
      const imported = await importRequestedPack(family.id,body.requestId,result.pack);
      return Response.json(imported,{status:imported.created ? 201 : 200});
    }
    if (!uuid(body.chapterId) || body.mappingConfirmed !== true) throw new TutorError("Confirm the chapter and exact section mapping.", 422);
    const imported = await importTutorPack(family.id, body.chapterId, result.pack);
    return Response.json(imported, { status: imported.created ? 201 : 200 });
  } catch (error) { return tutorError(error); }
}
export async function PATCH(request: Request) {
  try {
    const family = await parent(request); const body = await readTutorJSON(request, 2048);
    if (!uuid(body.id) || !["preview", "publish", "archive"].includes(String(body.action))) throw new TutorError("Choose a lesson and action.");
    if (body.action === "publish") await publishRequestedPack(family.id, body.id);
    else await manageTutorPack(family.id, body.id, body.action as "preview" | "archive");
    return Response.json({ updated: true });
  } catch (error) { return tutorError(error); }
}
