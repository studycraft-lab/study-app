import { childFromRequest } from "@/lib/family/request";
import { requestSection, tutorRequestLibrary } from "@/lib/tutor/request-store";
import { readTutorJSON, requireTutorEnabled, TutorError, tutorError, uuid } from "@/lib/tutor/http";
async function child(request: Request) {
  const profile = await childFromRequest(request);
  if (!profile) throw new TutorError("Child sign-in required.", 401);
  requireTutorEnabled(); return profile;
}
export async function GET(request: Request) {
  try { const profile = await child(request); return Response.json(await tutorRequestLibrary(profile.familyId, profile), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return tutorError(error); }
}
export async function POST(request: Request) {
  try {
    const profile = await child(request); const body = await readTutorJSON(request, 2048);
    if (!uuid(body.chapterId) || body.sectionId != null && !uuid(body.sectionId) || typeof body.heading !== "string" || !body.heading.trim() || body.heading.length > 200 || typeof body.page !== "string" || body.page.length > 80 || typeof body.note !== "string" || body.note.length > 300) throw new TutorError("Choose a chapter and give a short section heading, page reference and optional note.");
    return Response.json({ id: await requestSection(profile, { chapterId: body.chapterId, sectionId: body.sectionId as string | null ?? null, heading: body.heading.trim(), page: body.page, note: body.note }) });
  } catch (error) { return tutorError(error); }
}
