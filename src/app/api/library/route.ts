import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";
import { getFamilyWorkspace } from "@/lib/family/store";
import { deleteQuestionBankVersion, listLibrary } from "@/lib/question-bank/store";

export async function GET(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent import is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  try {
    return Response.json({ chapters: await listLibrary() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Library unavailable." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) return Response.json({ deleted: false, error: "Choose a bank version to delete." }, { status: 400 });
    const workspace = await getFamilyWorkspace();
    const deleted = await deleteQuestionBankVersion({ id, familyId: workspace.family.id });
    return Response.json({ deleted: true, ...deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The bank version could not be deleted.";
    const status = message === "Question bank not found." ? 404 : message === "A bank with study history cannot be deleted." ? 409 : 500;
    return Response.json({ deleted: false, error: message }, { status });
  }
}
