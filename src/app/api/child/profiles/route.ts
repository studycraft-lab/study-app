import { isChildPreviewAuthorized } from "@/lib/child-preview-auth";
import { listActiveChildren } from "@/lib/family/store";

export async function GET(request: Request) {
  if (!isChildPreviewAuthorized(request)) return Response.json({ error: "A parent needs to unlock this device first." }, { status: 401 });
  try {
    return Response.json({ children: await listActiveChildren() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Child profiles are unavailable." }, { status: 500 });
  }
}
