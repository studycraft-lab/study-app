import { getFamilyWorkspace } from "@/lib/family/store";
import { listParentGrammarAppeals, resolveGrammarAppeal } from "@/lib/english/grammar-appeals";
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
    return Response.json({ pending: await listParentGrammarAppeals(workspace.family.id) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Grammar appeals are unavailable." }, { status: 500 }); }
}
export async function PATCH(request: Request) {
  const authError = unauthorized(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    if (typeof body?.appealId !== "string" || typeof body?.correct !== "boolean" ||
      (body?.comment !== undefined && (typeof body.comment !== "string" || body.comment.length > 1000))) {
      return Response.json({ error: "Appeal and final verdict are required." }, { status: 400 });
    }
    const workspace = await getFamilyWorkspace();
    return Response.json({ resolution: await resolveGrammarAppeal({ appealId: body.appealId, familyId: workspace.family.id,
      resolverName: workspace.parent.displayName, correct: body.correct, comment: body.comment }) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not resolve the appeal." }, { status: 500 }); }
}
