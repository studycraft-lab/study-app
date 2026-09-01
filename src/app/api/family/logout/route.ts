import { clearChildPreviewCookie } from "@/lib/child-preview-auth";
import { clearChildSessionCookie } from "@/lib/family/session";
import { clearParentSessionCookie } from "@/lib/parent-session";
export async function POST() {
  const headers = new Headers(); headers.append("set-cookie", clearParentSessionCookie()); headers.append("set-cookie", clearChildSessionCookie()); headers.append("set-cookie", clearChildPreviewCookie());
  return Response.json({ signedOut: true }, { headers });
}
