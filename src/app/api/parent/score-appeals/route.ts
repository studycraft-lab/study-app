import { getFamilyWorkspace } from "@/lib/family/store";
import { listScoreAppeals, resolveScoreAppeal } from "@/lib/learning/appeals";
import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";

function unauthorized(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Parent sign-in required." }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const authError = unauthorized(request);
  if (authError) return authError;
  try {
    const workspace = await getFamilyWorkspace();
    return Response.json(await listScoreAppeals(workspace.family.id));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Appeals are unavailable." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authError = unauthorized(request);
  if (authError) return authError;
  try {
    const workspace = await getFamilyWorkspace();
    const body = await request.json();
    if (typeof body?.appealId !== "string" || typeof body?.earnedMarks !== "number") {
      return Response.json({ error: "Appeal and awarded marks are required." }, { status: 400 });
    }
    return Response.json({ resolution: await resolveScoreAppeal({
      appealId: body.appealId, familyId: workspace.family.id, resolverName: workspace.parent.displayName,
      earnedMarks: body.earnedMarks, comment: typeof body.comment === "string" ? body.comment : undefined,
    }) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The appeal could not be resolved." }, { status: 500 });
  }
}
