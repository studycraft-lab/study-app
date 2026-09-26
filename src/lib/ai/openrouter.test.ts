import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { classifyRubric } from "./openrouter";

describe("classifyRubric", () => {
  afterEach(() => vi.unstubAllEnvs());
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

  it("retries retryable provider failures before succeeding", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        model: "deepseek/deepseek-v4-flash",
        choices: [{ message: { content: JSON.stringify({ points: [{ id: "p1", coverage: "covered", confidence: 0.9 }], feedback: "Correct.", confidence: 0.9, spellingErrors: [], grammarErrors: [] }) } }],
      })));

    const result = await classifyRubric(
      { question: "Q", childAnswer: "A", groundedEvidence: "E", points: [{ id: "p1", concept: "C" }], checkSpelling: false, checkGrammar: false },
      { fetchImpl: fetchImpl as typeof fetch, apiKey: "test", maxAttempts: 2, retryDelayMs: 0 },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.meta).toMatchObject({ attempts: 2, fallbackUsed: false });
  });

  it("uses the configured fallback only after primary retries fail", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        model: "openai/gpt-5-mini",
        choices: [{ message: { content: JSON.stringify({ points: [{ id: "p1", coverage: "covered", confidence: 0.95 }], feedback: "Correct.", confidence: 0.95, spellingErrors: [], grammarErrors: [] }) } }],
      })));

    const result = await classifyRubric(
      { question: "Q", childAnswer: "A", groundedEvidence: "E", points: [{ id: "p1", concept: "C" }], checkSpelling: false, checkGrammar: false },
      { fetchImpl: fetchImpl as typeof fetch, apiKey: "test", maxAttempts: 2, retryDelayMs: 0, fallbackModel: "openai/gpt-5-mini" },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchImpl.mock.calls[2][1]?.body)).model).toBe("openai/gpt-5-mini");
    expect(result.meta).toMatchObject({ attempts: 3, fallbackUsed: true, model: "openai/gpt-5-mini" });
  });

  it("allows enough completion tokens to grade a nine-point answer", async () => {
    const points = Array.from({ length: 9 }, (_, index) => ({ id: `p${index + 1}`, concept: `Required point ${index + 1}` }));
    const judgement = { points: points.map(({ id }) => ({ id, coverage: "covered", confidence: 0.9 })), feedback: "Good answer.", confidence: 0.9, spellingErrors: [], grammarErrors: [] };
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const budget = body.max_completion_tokens ?? body.max_tokens;
      return new Response(JSON.stringify(budget < 2400
        ? { choices: [{ finish_reason: "length", message: { content: null } }], usage: { completion_tokens: budget } }
        : { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(judgement) } }] }));
    });

    const result = await classifyRubric(
      { question: "Answer all three parts", childAnswer: "A three-part response", groundedEvidence: "Textbook evidence", points, checkSpelling: false, checkGrammar: false },
      { fetchImpl: fetchImpl as typeof fetch, apiKey: "test", maxAttempts: 2, retryDelayMs: 0 },
    );

    expect(result.points).toHaveLength(9);
    expect(result.meta.attempts).toBeLessThanOrEqual(2);
  });

  it("raises the completion limit after a length-truncated response", async () => {
    const budgets: number[] = [];
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      budgets.push(body.max_completion_tokens);
      return new Response(JSON.stringify(budgets.length === 1
        ? { choices: [{ finish_reason: "length", message: { content: null } }] }
        : { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ points: [{ id: "p1", coverage: "covered", confidence: 0.9 }], feedback: "Correct.", confidence: 0.9, spellingErrors: [], grammarErrors: [] }) } }] }));
    });

    const result = await classifyRubric(
      { question: "Q", childAnswer: "A", groundedEvidence: "E", points: [{ id: "p1", concept: "C" }], checkSpelling: false, checkGrammar: false },
      { fetchImpl: fetchImpl as typeof fetch, apiKey: "test", maxAttempts: 2, retryDelayMs: 0 },
    );

    expect(budgets).toEqual([1600, 3200]);
    expect(result.meta.attempts).toBe(2);
  });

  it("requires and parses a judgement for every rubric point", async () => {
    const points = ["a1", "a2", "b1", "b2", "c1", "c2"].map((id) => ({ id, concept: `Required fact ${id}` }));
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.response_format.json_schema.schema.properties.points.required).toEqual(points.map(({ id }) => id));
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        points: Object.fromEntries(points.map(({ id }) => [id, { coverage: "covered", confidence: 0.9 }])),
        feedback: "Good answer.", confidence: 0.9, spellingErrors: [], grammarErrors: [],
      }) } }] }));
    });

    const result = await classifyRubric(
      { question: "Answer all parts", childAnswer: "Answer", groundedEvidence: "Evidence", points, checkSpelling: false, checkGrammar: false },
      { fetchImpl: fetchImpl as typeof fetch, apiKey: "test", maxAttempts: 1 },
    );

    expect(result.points.map(({ id }) => id)).toEqual(points.map(({ id }) => id));
  });

  it("allows a long rubric to complete despite a short configured timeout", async () => {
    vi.stubEnv("OPENROUTER_TIMEOUT_MS", "50");
    const points = Array.from({ length: 6 }, (_, index) => ({ id: `p${index + 1}`, concept: `Point ${index + 1}` }));
    const fetchImpl = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        points: Object.fromEntries(points.map(({ id }) => [id, { coverage: "covered", confidence: 0.9 }])),
        feedback: "Complete.", confidence: 0.9, spellingErrors: [], grammarErrors: [],
      }) } }] }))), 80);
      init?.signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); });
    }));

    const result = await classifyRubric(
      { question: "Long answer", childAnswer: "Answer", groundedEvidence: "Evidence", points, checkSpelling: false, checkGrammar: false },
      { fetchImpl: fetchImpl as typeof fetch, apiKey: "test", maxAttempts: 1 },
    );

    expect(result.points).toHaveLength(6);
  });
});
