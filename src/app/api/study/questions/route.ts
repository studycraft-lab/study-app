import { childFromRequest } from "@/lib/family/request";
import { getQuestionBankForChild } from "@/lib/question-bank/store";
import { prepareSession } from "@/lib/study/session";

export async function GET(request: Request) {
  const bankId = new URL(request.url).searchParams.get("bankId");
  if (!bankId) return Response.json({ error: "Choose a chapter." }, { status: 400 });
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    return Response.json({ questions: prepareSession(await getQuestionBankForChild(bankId, { familyId: child.familyId, board: child.board, grade: child.grade })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Questions unavailable." }, { status: 500 });
  }
}
