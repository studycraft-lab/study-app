import { childFromRequest } from "@/lib/family/request";
import { childLearningHistory } from "@/lib/learning/store";

export async function GET(request: Request) {
  try {
    const child = await childFromRequest(request);
    if (!child) return Response.json({ error: "Choose your profile to continue." }, { status: 401 });
    return Response.json(await childLearningHistory(child));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "History is unavailable." }, { status: 500 });
  }
}
