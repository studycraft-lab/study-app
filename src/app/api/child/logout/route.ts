import { clearChildSessionCookie } from "@/lib/family/session";

export async function POST() {
  return Response.json({ signedOut: true }, { headers: { "set-cookie": clearChildSessionCookie() } });
}
