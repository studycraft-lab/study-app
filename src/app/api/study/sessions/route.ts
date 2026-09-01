import { childFromRequest } from "@/lib/family/request";
import { completeStudySession, createStudySession } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.bankId !== "string" || !Number.isInteger(body?.totalQuestions) || body.totalQuestions < 1) return Response.json({ error: "Session request is incomplete." }, { status: 400 });
    const bank = await getQuestionBankForChild(body.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    return Response.json({ sessionId: await createStudySession({ child, bankId: body.bankId, bank, totalQuestions: body.totalQuestions }) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Session could not be started." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.sessionId !== "string") return Response.json({ error: "Session is missing." }, { status: 400 });
    await completeStudySession(body.sessionId, child.id);
    return Response.json({ completed: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Session could not be completed." }, { status: 500 });
  }
}
