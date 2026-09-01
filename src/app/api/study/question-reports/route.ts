import { childFromRequest } from "@/lib/family/request";
import { reportQuestion } from "@/lib/question-bank/reports";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.bankId !== "string" || typeof body?.questionId !== "string") return Response.json({ error: "Question is missing." }, { status: 400 });
    return Response.json({ reportId: await reportQuestion({
      child, bankId: body.bankId, questionId: body.questionId,
      attemptId: typeof body.attemptId === "string" ? body.attemptId : undefined,
      note: typeof body.note === "string" ? body.note : undefined,
    }) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The question could not be reported." }, { status: 500 });
  }
}
