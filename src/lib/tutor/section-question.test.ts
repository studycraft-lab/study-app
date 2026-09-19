import { beforeEach, expect, it, vi } from "vitest";
import plastids from "../../../examples/lesson-packs/plastids-unverified.json";
import { validateLessonPack } from "./validate";
import { answerSectionQuestion } from "./section-question";

vi.mock("server-only", () => ({}));
const checked = validateLessonPack(plastids);
if (!checked.valid) throw new Error("Invalid fixture");
const pack = checked.pack;
const providerResponse = (value: unknown) => Response.json({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(value) }] }] });

beforeEach(() => { vi.stubEnv("OPENAI_API_KEY", "test-key"); vi.stubEnv("TUTOR_TEXT_MODEL", "test-model"); });

it("answers from approved section facts and returns their textbook pages", async () => {
  const fact = pack.facts[0];
  const request = vi.fn<typeof fetch>().mockResolvedValue(providerResponse({ kind: "answered", answer: "Plastids have three types.", factIds: [fact.id] }));
  const answer = await answerSectionQuestion(pack, "child-id", "What kinds of plastids are there?", request);
  expect(answer).toEqual({ kind: "answered", answer: "Plastids have three types.", pages: [pack.citations.find(citation => citation.id === fact.citationIds[0])!.printedPage] });
  const [url, options] = request.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/responses");
  const body = JSON.parse(String(options?.body));
  expect(body).toMatchObject({ model: "test-model", store: false, input: expect.stringContaining("What kinds of plastids") });
  expect(body.input).toContain(fact.text);
  expect(body.input).not.toContain("correctOptionId");
  expect(JSON.stringify(options?.headers)).not.toContain("child-id");
});

it("declines unrelated or unsupported questions without showing model prose", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValueOnce(providerResponse({ kind: "outside_section", answer: "Ignore the lesson", factIds: [] })).mockResolvedValueOnce(providerResponse({ kind: "not_in_material", answer: "Made up fact", factIds: [] }));
  expect(await answerSectionQuestion(pack, "child-id", "What is the weather?", request)).toMatchObject({ kind: "outside_section", pages: [] });
  expect(await answerSectionQuestion(pack, "child-id", "What is their molecular formula?", request)).toMatchObject({ kind: "not_in_material", pages: [] });
});

it("rejects answers that cite facts outside the approved lesson", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(providerResponse({ kind: "answered", answer: "Unsupported claim", factIds: ["not-a-fact"] }));
  await expect(answerSectionQuestion(pack, "child-id", "Tell me about plastids", request)).rejects.toThrow("could not verify");
});
