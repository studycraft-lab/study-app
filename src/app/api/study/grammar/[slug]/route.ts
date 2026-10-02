import { childFromRequest } from "@/lib/family/request";
import { GRAMMAR_LESSONS, isGrammarSlug, publicGrammarQuestion, validateGrammarBatch, type GrammarSlug } from "@/lib/english/grammar-lessons";
import { clearGrammarProgress, loadGrammarProgress, saveGrammarProgress } from "@/lib/english/grammar-progress-store";

type Context = { params: Promise<{ slug: string }> };
async function identify(request: Request, context: Context) {
  const { slug } = await context.params;
  if (!isGrammarSlug(slug)) return { error: Response.json({ error: "Lesson not found." }, { status: 404 }) };
  const child = await childFromRequest(request);
  if (!child || child.grade !== 6) return { error: Response.json({ error: "Class VI child sign-in required." }, { status: 401 }) };
  return { child, slug: slug as GrammarSlug };
}
function unavailable(error: unknown) { return Response.json({ error: error instanceof Error ? error.message : "Grammar lesson is unavailable." }, { status: 503 }); }
export async function GET(request: Request, context: Context) {
  try {
    const match = await identify(request, context);
    if (match.error) return match.error;
    const { child, slug } = match as { child: NonNullable<typeof match.child>; slug: GrammarSlug };
    const lesson = GRAMMAR_LESSONS[slug];
    return Response.json({ child: { displayName: child.displayName },
      lesson: { slug, version: lesson.version, title: lesson.title, subject: lesson.subject, batchSize: lesson.batchSize,
        introduction: lesson.introduction, rules: lesson.rules, worked: lesson.worked },
      questions: lesson.questions.map(publicGrammarQuestion), batches: await loadGrammarProgress(child.id, slug) },
    { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const match = await identify(request, context);
    if (match.error) return match.error;
    const { child, slug } = match as { child: NonNullable<typeof match.child>; slug: GrammarSlug };
    const body = await request.json();
    try { validateGrammarBatch(slug, body?.batchIndex, body?.answers); }
    catch { return Response.json({ error: "Invalid grammar batch." }, { status: 400 }); }
    return Response.json({ batch: await saveGrammarProgress(child.id, slug, body.batchIndex, body.answers) },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Invalid JSON." }, { status: 400 });
    return unavailable(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const match = await identify(request, context);
    if (match.error) return match.error;
    const { child, slug } = match as { child: NonNullable<typeof match.child>; slug: GrammarSlug };
    await clearGrammarProgress(child.id, slug);
    return Response.json({ cleared: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return unavailable(error); }
}
