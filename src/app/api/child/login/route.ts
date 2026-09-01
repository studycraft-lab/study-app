import { validPin } from "@/lib/family/pin";
import { childSessionCookie } from "@/lib/family/session";
import { authenticateChildByName } from "@/lib/family/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.displayName !== "string" || !body.displayName.trim() || !validPin(body?.pin)) return Response.json({ error: "Enter your name and PIN." }, { status: 400 });
    const child = await authenticateChildByName(body.displayName, body.pin);
    if (!child) return Response.json({ error: "That name or PIN is not correct." }, { status: 401 });
    return Response.json({ child }, { headers: { "set-cookie": childSessionCookie(child.id) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return Response.json({ error: message }, { status: message.startsWith("Too many") ? 429 : 500 });
  }
}
