import { createChild, updateChild } from "@/lib/family/store";
import { validPin } from "@/lib/family/pin";
import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";

function profileInput(body: Record<string, unknown>) {
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const board = typeof body.board === "string" ? body.board.trim() : "";
  const grade = Number(body.grade);
  if (!displayName || !board || !Number.isInteger(grade) || grade < 1 || grade > 12) return null;
  return { displayName, board, grade };
}

function authorized(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!isParentAuthorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const denied = authorized(request); if (denied) return denied;
  try {
    const body = await request.json();
    const input = profileInput(body);
    if (!input || !validPin(body.pin)) return Response.json({ error: "Enter a name, board, grade 1–12, and a 4–8 digit PIN." }, { status: 400 });
    return Response.json({ child: await createChild({ ...input, pin: body.pin }) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Child could not be added." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = authorized(request); if (denied) return denied;
  try {
    const body = await request.json();
    const input = profileInput(body);
    const id = typeof body.id === "string" ? body.id : "";
    const pin = body.pin === "" || body.pin === undefined ? undefined : body.pin;
    if (!id || !input || (pin !== undefined && !validPin(pin))) return Response.json({ error: "Check the profile details. A new PIN must contain 4–8 digits." }, { status: 400 });
    return Response.json({ child: await updateChild({ ...input, id, active: body.active !== false, pin }) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Child could not be updated." }, { status: 500 });
  }
}
