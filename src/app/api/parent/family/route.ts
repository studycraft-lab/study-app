import { getFamilyWorkspace } from "@/lib/family/store";
import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";

export async function GET(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  try {
    return Response.json(await getFamilyWorkspace());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Family workspace is unavailable." }, { status: 500 });
  }
}
