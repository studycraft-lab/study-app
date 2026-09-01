import { isChildPreviewAuthorized } from "@/lib/child-preview-auth";
import { validPin } from "@/lib/family/pin";
import { childSessionCookie } from "@/lib/family/session";
import { authenticateChild } from "@/lib/family/store";

export async function POST(request: Request) {
  if (!isChildPreviewAuthorized(request)) return Response.json({ error: "A parent needs to unlock this device first." }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.childId !== "string" || !validPin(body?.pin)) return Response.json({ error: "Choose your profile and enter your PIN." }, { status: 400 });
    const child = await authenticateChild(body.childId, body.pin);
    if (!child) return Response.json({ error: "That PIN is not correct." }, { status: 401 });
    return Response.json({ child }, { headers: { "set-cookie": childSessionCookie(child.id) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return Response.json({ error: message }, { status: message.startsWith("Too many") ? 429 : 500 });
  }
}
