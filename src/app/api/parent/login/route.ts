import { isParentPassphrase, parentAuthConfigured } from "@/lib/parent-auth";
import { parentSessionCookie } from "@/lib/parent-session";

export async function POST(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  const body = await request.json();
  if (!isParentPassphrase(typeof body?.passphrase === "string" ? body.passphrase : null)) return Response.json({ error: "That parent password is not correct." }, { status: 401 });
  return Response.json({ signedIn: true }, { headers: { "set-cookie": parentSessionCookie() } });
}
