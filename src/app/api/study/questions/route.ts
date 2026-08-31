import { isChildPreviewAuthorized } from "@/lib/child-preview-auth";
import { getQuestionBank } from "@/lib/question-bank/store";
import { prepareSession } from "@/lib/study/session";

export async function GET(request: Request) {
  if (!isChildPreviewAuthorized(request)) return Response.json({ error: "Child preview is locked." }, { status: 401 });
  const bankId = new URL(request.url).searchParams.get("bankId");
  if (!bankId) return Response.json({ error: "Choose a chapter." }, { status: 400 });
  try {
    return Response.json({ questions: prepareSession(await getQuestionBank(bankId)) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Questions unavailable." }, { status: 500 });
  }
}
