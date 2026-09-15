import { isParentAuthorized } from "@/lib/parent-auth";
import { ensureFamily } from "@/lib/family/store";
import { catalogueSection, manageRequest, tutorRequestLibrary } from "@/lib/tutor/request-store";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
async function parent(request: Request) { if (!isParentAuthorized(request)) throw new TutorError("Parent sign-in required.", 401); requireTutorEnabled(); return ensureFamily(); }
export async function GET(request: Request) {
  try { const family = await parent(request); return Response.json(await tutorRequestLibrary(family.id), { headers: { "Cache-Control": "no-store" } }); } catch (error) { return tutorError(error); }
}
export async function POST(request: Request) {
  try {
    const family = await parent(request); const body = await readTutorJSON(request, 2048);
    if (!uuid(body.chapterId) || typeof body.key !== "string" || !/^[a-z][a-z0-9_-]{0,63}$/.test(body.key) || typeof body.heading !== "string" || !body.heading.trim() || body.heading.length > 200 || !Array.isArray(body.pages) || body.pages.length > 20 || body.pages.some(p => typeof p !== "string" || !p.trim() || p.length > 20)) throw new TutorError("Enter a chapter, stable section key, exact heading and printed pages.");
    return Response.json({ id: await catalogueSection(family.id, { chapterId: body.chapterId, key: body.key, heading: body.heading.trim(), pages: body.pages }) });
  } catch (error) { return tutorError(error); }
}
export async function PATCH(request: Request) {
  try {
    const family = await parent(request); const body = await readTutorJSON(request, 2048);
    if (!uuid(body.id) || !["preparing", "ready", "decline"].includes(String(body.action)) || body.sectionId != null && !uuid(body.sectionId) || body.packId != null && !uuid(body.packId) || typeof body.reason !== "string" || body.reason.length > 300) throw new TutorError("Choose a request, section and valid status action.");
    await manageRequest(family.id, { id: body.id, action: String(body.action), sectionId: body.sectionId as string | null ?? null, packId: body.packId as string | null ?? null, reason: body.reason });
    return Response.json({ updated: true });
  } catch (error) { return tutorError(error); }
}
