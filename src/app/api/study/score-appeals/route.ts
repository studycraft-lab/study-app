import { childFromRequest } from "@/lib/family/request";
import { createScoreAppeal } from "@/lib/learning/appeals";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.attemptId !== "string") return Response.json({ error: "Answer attempt is missing." }, { status: 400 });
    const appeal = await createScoreAppeal({ child, attemptId: body.attemptId, comment: typeof body.comment === "string" ? body.comment : undefined });
    return Response.json({ appeal }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The appeal could not be saved." }, { status: 500 });
  }
}
