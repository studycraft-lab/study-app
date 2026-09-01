import { clearParentSessionCookie } from "@/lib/parent-session";
export async function POST() { return Response.json({ signedOut: true }, { headers: { "set-cookie": clearParentSessionCookie() } }); }
