import { dismissQuestionReport, listOpenQuestionReports, patchReportedQuestion } from "@/lib/question-bank/reports";
import { isParentAuthorized, parentAuthConfigured } from "@/lib/parent-auth";

function authorized(request: Request) {
  return parentAuthConfigured() && isParentAuthorized(request);
}

export async function GET(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!authorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  try {
    return Response.json({ reports: await listOpenQuestionReports() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Reports are unavailable." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!parentAuthConfigured()) return Response.json({ error: "Parent access is not configured." }, { status: 503 });
  if (!authorized(request)) return Response.json({ error: "Incorrect parent passphrase." }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.reportId !== "string") return Response.json({ error: "Report is missing." }, { status: 400 });
    if (body.action === "dismiss") {
      await dismissQuestionReport(body.reportId);
      return Response.json({ dismissed: true });
    }
    if (body.action === "patch") return Response.json({ corrected: await patchReportedQuestion(body.reportId, body.question) });
    return Response.json({ error: "Unknown report action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The report could not be updated." }, { status: 500 });
  }
}
