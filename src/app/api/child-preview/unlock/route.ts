import { childPreviewCookie } from "@/lib/child-preview-auth";
import { isParentPassphrase, parentAuthConfigured } from "@/lib/parent-auth";

export async function POST(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Child preview is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    if (!isParentPassphrase(typeof body?.passphrase === "string" ? body.passphrase : null)) {
      return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
    }
    return Response.json({ unlocked: true }, { headers: { "set-cookie": childPreviewCookie() } });
  } catch {
    return Response.json({ error: "Enter the parent passphrase." }, { status: 400 });
  }
}
