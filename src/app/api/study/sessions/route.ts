import { childFromRequest } from "@/lib/family/request";
import { completeStudySession, createStudySession, resumableStudySession } from "@/lib/learning/store";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { prepareReviewSession, selectableQuestionIds } from "@/lib/study/session";
import { QUESTIONS_PER_EXERCISE } from "@/lib/study/config";

export async function GET(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return Response.json({ error: "Session is missing." }, { status: 400 });
    const session = await resumableStudySession(sessionId, child.id);
    const bank = await getQuestionBankForChild(session.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    return Response.json({ bankId: session.bankId, questions: prepareReviewSession(bank, session.questionIds, session.presentationSeed), attempts: session.attempts });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Session could not be resumed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.bankId !== "string" || typeof body?.presentationSeed !== "string" || body.presentationSeed.length < 1 || body.presentationSeed.length > 100 || !Array.isArray(body?.questionIds) || body.questionIds.length < 1 || body.questionIds.length > QUESTIONS_PER_EXERCISE || body.questionIds.some((id: unknown) => typeof id !== "string")) return Response.json({ error: "Session request is incomplete." }, { status: 400 });
    const bank = await getQuestionBankForChild(body.bankId, { familyId: child.familyId, board: child.board, grade: child.grade });
    const available = new Set(selectableQuestionIds(bank));
    const questionIds = [...new Set(body.questionIds as string[])];
    if (questionIds.length !== body.questionIds.length || questionIds.some((id) => !available.has(id))) return Response.json({ error: "Session contains unavailable questions." }, { status: 400 });
    return Response.json({ sessionId: await createStudySession({ child, bankId: body.bankId, bank, questionIds, presentationSeed: body.presentationSeed }) }, { status: 201 });
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
