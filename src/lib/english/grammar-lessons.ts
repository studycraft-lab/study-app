import prepositions from "@/content/english/prepositions.json";
import conjunctions from "@/content/english/conjunctions.json";
import tenses from "@/content/english/tenses.json";
import pronouns from "@/content/english/pronouns.json";
import adjectives from "@/content/english/adjectives.json";

export const GRAMMAR_LESSONS = { prepositions, conjunctions, tenses, pronouns, adjectives };
export type GrammarSlug = keyof typeof GRAMMAR_LESSONS;
export type GrammarQuestion = (typeof prepositions.questions)[number] | (typeof conjunctions.questions)[number] | (typeof tenses.questions)[number] | (typeof pronouns.questions)[number] | (typeof adjectives.questions)[number];
export type GrammarResult = { id: string; number: number; status: "correct" | "incorrect" | "review"; expectedAnswer: string; explanation: string };

export function isGrammarSlug(value: string): value is GrammarSlug { return value === "prepositions" || value === "conjunctions" || value === "tenses" || value === "pronouns" || value === "adjectives"; }
export function publicGrammarQuestion(question: GrammarQuestion) {
  return { id: question.id, number: question.number, kind: question.kind, prompt: question.prompt, origin: question.origin,
    options: "options" in question ? question.options : undefined,
    context: "context" in question ? question.context : undefined,
    blankNumber: "blankNumber" in question ? question.blankNumber : undefined,
    starter: "starter" in question ? question.starter : undefined,
    requiredConnector: "requiredConnector" in question ? question.requiredConnector : undefined };
}
export function usesRequiredConnector(answer: string, connector: string): boolean {
  const parts = connector.toLocaleLowerCase("en").split(/\s*\.\.\.\s*/u);
  const words = answer.toLocaleLowerCase("en");
  let offset = 0;
  for (const part of parts) {
    const match = new RegExp(`\\b${part.replace(/\s+/gu, "\\s+")}\\b`, "iu").exec(words.slice(offset));
    if (!match) return false;
    offset += match.index + match[0].length;
  }
  return true;
}
export function normalizeGrammarAnswer(value: string): string {
  return value.normalize("NFKC").replace(/[\u2018\u2019\u02BC]/gu, "'").trim().replace(/[.,!?;:]+$/u, "")
    .replace(/\s+/gu, " ").toLocaleLowerCase("en");
}
function normalizeIdentification(value: string): string {
  return normalizeGrammarAnswer(value).replace(/\b(?:pronoun|adjective|of)\b/gu, "")
    .split(/[^\p{L}\p{N}]+/gu).filter(Boolean).sort().join(" ");
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
    const normalize = question.kind === "identify" ? normalizeIdentification : normalizeGrammarAnswer;
    const original = question.kind === "rewrite" || question.kind === "join" ? "starter" in question ? question.starter ?? question.prompt : question.prompt : null;
    const unchanged = original !== null && normalizeGrammarAnswer(answer) === normalizeGrammarAnswer(original);
    let status: GrammarResult["status"] = accepted.some((item) => normalize(item) === normalize(answer)) ? "correct" : "incorrect";
    if (status === "incorrect" && answer) {
      if (question.kind === "join") {
        const required = "requiredConnector" in question ? question.requiredConnector : undefined;
        const meetsConnectorRule = required ? usesRequiredConnector(answer, required) : !/\b(and|but|so)\b/iu.test(answer);
        if (!unchanged && meetsConnectorRule) {
          try {
            const { classifyRubric } = await import("@/lib/ai/openrouter");
            const instruction = required ? `Use the specified conjunction (${required})` : "Do not use and, but or so";
            const grade = await classifyRubric({ question: `Join these sentences. ${instruction}: ${question.prompt}`,
              childAnswer: answer, groundedEvidence: `Original sentences: ${question.prompt}\nModel answer: ${question.answer}\nOther joins can be correct if grammatical, retain the complete original meaning and obey the connector restriction.`,
              points: [{ id: "meaning", concept: `The joined sentence keeps the full meaning of both original sentences, obeys this instruction: ${instruction}, and does not add a contradictory meaning.` }],
              checkSpelling: false, checkGrammar: true });
            status = grade.confidence >= 0.85 && grade.points[0].confidence >= 0.85
              ? grade.points[0].coverage === "covered" && grade.grammarErrors.length === 0 ? "correct" : "incorrect" : "review";
          } catch { status = "review"; }
        }
      } else if ("reviewOnMismatch" in question && question.reviewOnMismatch) status = "review";
    }
    const expectedAnswer = question.kind === "choice" && "options" in question
      ? question.options?.find((option) => option.id === question.answer)?.text ?? question.answer : question.answer;
    return { id: question.id, number: question.number, status, expectedAnswer,
      explanation: unchanged ? "This is still the original sentence. Edit it before checking." :
        question.kind === "join" && "requiredConnector" in question && question.requiredConnector && !usesRequiredConnector(answer, question.requiredConnector) ? `Use the conjunction shown in brackets: ${question.requiredConnector}.` :
        question.kind === "join" && !("requiredConnector" in question) && /\b(and|but|so)\b/iu.test(answer) ? 'For these worksheet joins, do not use the words “and”, “but”, or “so” anywhere in your answer.' :
        status === "review" ? "This answer needs a closer look. Compare it with the model answer; it has not been marked wrong." : question.explanation };
  }));
}
