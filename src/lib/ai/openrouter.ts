import "server-only";

export type RubricPointInput = { id: string; concept: string };
export type PointJudgement = { id: string; coverage: "covered" | "partial" | "missing"; confidence: number };
export type RubricClassification = {
  points: PointJudgement[];
  feedback: string;
  confidence: number;
  spellingErrors: string[];
  grammarErrors: string[];
  meta: {
    provider: "openrouter";
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
    attempts?: number;
    fallbackUsed?: boolean;
  };
};

export type RubricClassificationInput = {
  question: string;
  childAnswer: string;
  groundedEvidence: string;
  points: RubricPointInput[];
  checkSpelling: boolean;
  checkGrammar: boolean;
};

export class GradingUnavailableError extends Error {
  constructor(message: string, public readonly retryable = true, public readonly outputLimitReached = false) {
    super(message);
    this.name = "GradingUnavailableError";
  }
}

type FetchLike = typeof fetch;

function finite(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseClassification(value: unknown, pointIds: string[]) {
  const result = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const points = result.points;
  const byId = Array.isArray(points)
    ? new Map(points.map((item) => typeof item === "object" && item !== null ? item as Record<string, unknown> : {}).map((item) => [String(item.id), item]))
    : new Map(Object.entries(typeof points === "object" && points !== null ? points as Record<string, unknown> : {}).map(([id, item]) => [id, typeof item === "object" && item !== null ? item as Record<string, unknown> : {}]));
  if (pointIds.some((id) => !byId.has(id))) throw new GradingUnavailableError("The grading response was incomplete.");
  return {
    points: pointIds.map((id) => {
      const item = byId.get(id)!;
      const coverage = item.coverage;
      if (coverage !== "covered" && coverage !== "partial" && coverage !== "missing") throw new GradingUnavailableError("The grading response was invalid.");
      return { id, coverage, confidence: Math.max(0, Math.min(1, finite(item.confidence))) } as PointJudgement;
    }),
    feedback: String(result.feedback ?? "Review the required points and try again."),
    confidence: Math.max(0, Math.min(1, finite(result.confidence))),
    spellingErrors: Array.isArray(result.spellingErrors) ? result.spellingErrors.map(String).slice(0, 5) : [],
    grammarErrors: Array.isArray(result.grammarErrors) ? result.grammarErrors.map(String).slice(0, 5) : [],
  };
}

type ClassificationOptions = {
  fetchImpl?: FetchLike;
  apiKey?: string;
  model?: string;
  fallbackModel?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  retryDelayMs?: number;
};

async function requestClassification(input: RubricClassificationInput, options: Required<Pick<ClassificationOptions, "fetchImpl" | "apiKey" | "model" | "timeoutMs">> & { maxCompletionTokens: number }): Promise<RubricClassification> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(50, Math.min(options.timeoutMs, 60000)));
  const started = Date.now();
  try {
    const response = await options.fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json",
        "http-referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://studycraft-iota.vercel.app",
        "x-title": "StudyCraft",
      },
      body: JSON.stringify({
        model: options.model,
        temperature: 0,
        seed: 9,
        max_completion_tokens: options.maxCompletionTokens,
        messages: [
          { role: "system", content: "You grade a child's answer only against the supplied textbook-grounded evidence and rubric. Do not add general knowledge. Judge each point independently and return a judgement for every supplied point ID, including missing points. Partial means the idea is present but materially incomplete. Ignore spelling or grammar unless the request explicitly asks you to check it. Return concise, encouraging feedback without revealing hidden reasoning." },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "studycraft_rubric_grade",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["points", "feedback", "confidence", "spellingErrors", "grammarErrors"],
              properties: {
                points: { type: "object", additionalProperties: false, required: input.points.map((point) => point.id), properties: Object.fromEntries(input.points.map((point) => [point.id, { type: "object", additionalProperties: false, required: ["coverage", "confidence"], properties: { coverage: { enum: ["covered", "partial", "missing"] }, confidence: { type: "number", minimum: 0, maximum: 1 } } }])) },
                feedback: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                spellingErrors: { type: "array", items: { type: "string" } },
                grammarErrors: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      }),
    });
    if (!response.ok) {
      const retryable = response.status === 429 || response.status >= 500;
      throw new GradingUnavailableError(retryable ? "AI grading is temporarily unavailable." : "AI grading request was rejected.", retryable);
    }
    const payload = await response.json() as Record<string, unknown>;
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const message = typeof choices[0] === "object" && choices[0] !== null ? (choices[0] as Record<string, unknown>).message : null;
    const content = typeof message === "object" && message !== null ? (message as Record<string, unknown>).content : null;
    if (typeof content !== "string" || !content.trim()) {
      const hitLimit = typeof choices[0] === "object" && choices[0] !== null && (choices[0] as Record<string, unknown>).finish_reason === "length";
      throw new GradingUnavailableError(hitLimit ? "The grading response exceeded its output limit." : "The grading response was empty.", true, hitLimit);
    }
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { throw new GradingUnavailableError("The grading response was invalid."); }
    const classification = parseClassification(parsed, input.points.map((point) => point.id));
    const usage = typeof payload.usage === "object" && payload.usage !== null ? payload.usage as Record<string, unknown> : {};
    return {
      ...classification,
      meta: {
        provider: "openrouter",
        model: String(payload.model ?? options.model),
        promptTokens: finite(usage.prompt_tokens),
        completionTokens: finite(usage.completion_tokens),
        totalTokens: finite(usage.total_tokens),
        cost: finite(usage.cost),
        latencyMs: Date.now() - started,
        attempts: 1,
        fallbackUsed: false,
      },
    };
  } catch (error) {
    if (error instanceof GradingUnavailableError) throw error;
    throw new GradingUnavailableError(error instanceof Error && error.name === "AbortError" ? "AI grading timed out. Please try again." : "AI grading is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}

function wait(milliseconds: number) {
  return milliseconds > 0 ? new Promise((resolve) => setTimeout(resolve, milliseconds)) : Promise.resolve();
}

export async function classifyRubric(input: RubricClassificationInput, options: ClassificationOptions = {}): Promise<RubricClassification> {
  const apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new GradingUnavailableError("AI grading is not configured yet.", false);
  const model = options.model ?? process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash";
  const fallbackModel = options.fallbackModel ?? process.env.OPENROUTER_FALLBACK_MODEL;
  const configuredTimeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS || 30000);
  const timeoutMs = options.timeoutMs ?? Math.max(Number.isFinite(configuredTimeoutMs) ? configuredTimeoutMs : 30000, input.points.length >= 6 ? 60000 : 0);
  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? Number(process.env.OPENROUTER_MAX_ATTEMPTS || 2), 3));
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
  const fetchImpl = options.fetchImpl ?? fetch;
  const started = Date.now();
  let attempts = 0;
  let lastError = new GradingUnavailableError("AI grading is temporarily unavailable.");
  let maxCompletionTokens = Math.min(6000, Math.max(1600, input.points.length * 400));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    attempts += 1;
    try {
      const result = await requestClassification(input, { fetchImpl, apiKey, model, timeoutMs, maxCompletionTokens });
      return { ...result, meta: { ...result.meta, attempts, fallbackUsed: false, latencyMs: Date.now() - started } };
    } catch (error) {
      lastError = error instanceof GradingUnavailableError ? error : lastError;
      if (!lastError.retryable || attempt === maxAttempts - 1) break;
      if (lastError.outputLimitReached) maxCompletionTokens = Math.min(12000, maxCompletionTokens * 2);
      await wait(retryDelayMs * (attempt + 1));
    }
  }

  if (fallbackModel && fallbackModel !== model && lastError.retryable) {
    attempts += 1;
    try {
      const result = await requestClassification(input, { fetchImpl, apiKey, model: fallbackModel, timeoutMs, maxCompletionTokens });
      return { ...result, meta: { ...result.meta, attempts, fallbackUsed: true, latencyMs: Date.now() - started } };
    } catch (error) {
      lastError = error instanceof GradingUnavailableError ? error : lastError;
    }
  }

  throw lastError;
}
