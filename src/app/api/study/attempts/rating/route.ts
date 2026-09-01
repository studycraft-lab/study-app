import { childFromRequest } from "@/lib/family/request";
import { rateStudyAttempt } from "@/lib/learning/store";

export async function PATCH(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    const body = await request.json();
    if (typeof body?.attemptId !== "string" || !["up", "down"].includes(body?.rating)) return Response.json({ error: "Choose a thumbs rating." }, { status: 400 });
    await rateStudyAttempt({ attemptId: body.attemptId, childId: child.id, rating: body.rating });
    return Response.json({ saved: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Rating could not be saved." }, { status: 500 });
  }
}
