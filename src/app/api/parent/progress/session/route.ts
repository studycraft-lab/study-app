import { getFamilyWorkspace } from "@/lib/family/store";
import { purgeStudySession } from "@/lib/learning/store";
import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";

export async function DELETE(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Parent sign-in is required." }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.childId !== "string" || typeof body?.sessionId !== "string") return Response.json({ error: "Choose a session to delete." }, { status: 400 });
    const workspace = await getFamilyWorkspace();
    if (!workspace.children.some((child) => child.id === body.childId)) return Response.json({ error: "Study session was not found." }, { status: 404 });
    return Response.json({ deleted: true, ...(await purgeStudySession(body.sessionId, body.childId)) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Session could not be deleted." }, { status: 500 });
  }
}
