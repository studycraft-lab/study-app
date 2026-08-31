import { isChildPreviewAuthorized } from "@/lib/child-preview-auth";
import { listLibrary } from "@/lib/question-bank/store";

export async function GET(request: Request) {
  if (!isChildPreviewAuthorized(request)) return Response.json({ error: "Child preview is locked." }, { status: 401 });
  try {
    return Response.json({ chapters: await listLibrary() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Library unavailable." }, { status: 500 });
  }
}
