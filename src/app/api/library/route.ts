import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";
import { listLibrary } from "@/lib/question-bank/store";

export async function GET(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent import is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  try {
    return Response.json({ chapters: await listLibrary() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Library unavailable." }, { status: 500 });
  }
}
