import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { classifyRubric } from "./openrouter";

describe("classifyRubric", () => {
  it("requests grounded structured grading and records usage", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("deepseek/deepseek-v4-flash");
      expect(body.response_format.type).toBe("json_schema");
      expect(body.messages[1].content).toContain("sabha");
      return new Response(JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        choices: [{ message: { content: JSON.stringify({ points: [{ id: "p1", coverage: "covered", confidence: 0.94 }], feedback: "Good point.", confidence: 0.94, spellingErrors: [], grammarErrors: [] }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120, cost: 0.00002 },
      }));
    });
    const result = await classifyRubric({ question: "What did the sabha do?", childAnswer: "It advised the king.", groundedEvidence: "The sabha advised the king.", points: [{ id: "p1", concept: "sabha advised the king" }], checkSpelling: true, checkGrammar: false }, { fetchImpl: fetchImpl as typeof fetch, apiKey: "test-key", model: "deepseek/deepseek-v4-flash" });
    expect(result).toMatchObject({ points: [{ id: "p1", coverage: "covered" }], confidence: 0.94, meta: { provider: "openrouter", promptTokens: 100, completionTokens: 20, totalTokens: 120, cost: 0.00002 } });
    expect(fetchImpl).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer test-key" }) }));
  });

  it("rejects an incomplete model judgement", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ points: [], feedback: "", confidence: 0.5, spellingErrors: [], grammarErrors: [] }) } }] })));
    await expect(classifyRubric({ question: "Q", childAnswer: "A", groundedEvidence: "E", points: [{ id: "p1", concept: "C" }], checkSpelling: false, checkGrammar: false }, { fetchImpl: fetchImpl as typeof fetch, apiKey: "test" })).rejects.toThrow("incomplete");
  });
});
