import prepositions from "@/content/english/prepositions.json";
import conjunctions from "@/content/english/conjunctions.json";

export const GRAMMAR_LESSONS = { prepositions, conjunctions };
export type GrammarSlug = keyof typeof GRAMMAR_LESSONS;
export type GrammarQuestion = (typeof prepositions.questions)[number] | (typeof conjunctions.questions)[number];
export type GrammarResult = { id: string; number: number; status: "correct" | "incorrect" | "review"; expectedAnswer: string; explanation: string };

export function isGrammarSlug(value: string): value is GrammarSlug { return value === "prepositions" || value === "conjunctions"; }
export function publicGrammarQuestion(question: GrammarQuestion) {
  return { id: question.id, number: question.number, kind: question.kind, prompt: question.prompt, origin: question.origin,
    options: "options" in question ? question.options : undefined };
}
export function normalizeGrammarAnswer(value: string): string {
  return value.normalize("NFKC").replace(/[\u2018\u2019\u02BC]/gu, "'").trim().replace(/[.,!?;:]+$/u, "")
    .replace(/\s+/gu, " ").toLocaleLowerCase("en");
}
export function validateGrammarBatch(slug: GrammarSlug, batchIndex: number, answers: unknown): asserts answers is string[] {
  const lesson = GRAMMAR_LESSONS[slug];
  if (!Number.isInteger(batchIndex) || batchIndex < 0 || batchIndex >= lesson.questions.length / lesson.batchSize ||
    !Array.isArray(answers) || answers.length !== lesson.batchSize || answers.some((answer) => typeof answer !== "string" || answer.length > 500)) {
    throw new Error("Invalid grammar batch.");
  }
}
export async function gradeGrammarBatch(slug: GrammarSlug, batchIndex: number, answers: string[]): Promise<GrammarResult[]> {
  validateGrammarBatch(slug, batchIndex, answers);
  const questions = GRAMMAR_LESSONS[slug].questions.slice(batchIndex * 5, batchIndex * 5 + 5) as GrammarQuestion[];
  return Promise.all(questions.map(async (question, index): Promise<GrammarResult> => {
    const answer = answers[index].trim();
    const accepted = [question.answer, ...("accepted" in question ? (question.accepted ?? []) : [])];
    let status: GrammarResult["status"] = accepted.some((item) => normalizeGrammarAnswer(item) === normalizeGrammarAnswer(answer)) ? "correct" : "incorrect";
    if (status === "incorrect" && answer) {
      if (question.kind === "join") {
        if (!/\b(and|but|so)\b/iu.test(answer)) {
          try {
            const { classifyRubric } = await import("@/lib/ai/openrouter");
            const grade = await classifyRubric({ question: `Join these sentences without using and, but or so: ${question.prompt}`,
              childAnswer: answer, groundedEvidence: `Original sentences: ${question.prompt}\nModel answer: ${question.answer}\nOther joins can be correct if grammatical, retain the complete original meaning and obey the connector restriction.`,
              points: [{ id: "meaning", concept: "The joined sentence keeps the full meaning of both original sentences, uses a suitable conjunction or relative connector, and does not add a contradictory meaning." }],
              checkSpelling: false, checkGrammar: true });
            status = grade.confidence >= 0.85 && grade.points[0].confidence >= 0.85
              ? grade.points[0].coverage === "covered" && grade.grammarErrors.length === 0 ? "correct" : "incorrect" : "review";
          } catch { status = "review"; }
        }
      } else if ("reviewOnMismatch" in question && question.reviewOnMismatch) status = "review";
    }
    return { id: question.id, number: question.number, status, expectedAnswer: question.answer,
      explanation: status === "review" ? "This answer needs a closer look. Compare it with the model answer; it has not been marked wrong." : question.explanation };
  }));
}
