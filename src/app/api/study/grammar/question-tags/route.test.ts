import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { childFromRequest } from "@/lib/family/request";
import { loadQuestionTagProgress, saveQuestionTagProgress } from "@/lib/english/progress-store";

vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/lib/english/progress-store", () => ({ loadQuestionTagProgress: vi.fn(), saveQuestionTagProgress: vi.fn(), clearQuestionTagProgress: vi.fn() }));

const url = "http://localhost/api/study/grammar/question-tags";

describe("Question Tags API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(childFromRequest).mockResolvedValue({ id: "child-one", grade: 6 } as never);
    vi.mocked(loadQuestionTagProgress).mockResolvedValue([]);
  });

  it("requires a Class VI child", async () => {
    vi.mocked(childFromRequest).mockResolvedValueOnce(null);
    expect((await GET(new Request(url))).status).toBe(401);
    vi.mocked(childFromRequest).mockResolvedValueOnce({ id: "younger", grade: 5 } as never);
    expect((await GET(new Request(url))).status).toBe(401);
  });

  it("returns five-at-a-time content without an answer key", async () => {
    const response = await GET(new Request(url));
    const body = await response.json();
    expect(body.questions).toHaveLength(40);
    expect(body.lesson.batchSize).toBe(5);
    expect(body.questions[0].prompt).toBe("The children are preparing for the annual concert, __________?");
    expect(JSON.stringify(body.questions)).not.toContain('"answer"');
    expect(loadQuestionTagProgress).toHaveBeenCalledWith("child-one");
  });

  it("rejects malformed batches and saves a valid batch for the authenticated child", async () => {
    const invalid = await POST(new Request(url, { method: "POST", body: JSON.stringify({ batchIndex: 0, answers: ["aren't they"] }) }));
    expect(invalid.status).toBe(400);
    expect(saveQuestionTagProgress).not.toHaveBeenCalled();
    const answers = ["aren't they", "have you", "can't he", "shall we", "did they"];
    vi.mocked(saveQuestionTagProgress).mockResolvedValue({ batchIndex: 0, answers, results: [] });
    const response = await POST(new Request(url, { method: "POST", body: JSON.stringify({ batchIndex: 0, answers }) }));
    expect(response.status).toBe(200);
    expect(saveQuestionTagProgress).toHaveBeenCalledWith("child-one", 0, answers);
  });
});
