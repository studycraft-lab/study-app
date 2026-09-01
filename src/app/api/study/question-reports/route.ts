import { childFromRequest } from "@/lib/family/request";
import { reportQuestion } from "@/lib/question-bank/reports";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.attemptId !== "string") return Response.json({ error: "Answer attempt is missing." }, { status: 400 });
    return Response.json({ reportId: await reportQuestion({ child, attemptId: body.attemptId, note: typeof body.note === "string" ? body.note : undefined }) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The question could not be reported." }, { status: 500 });
  }
}
