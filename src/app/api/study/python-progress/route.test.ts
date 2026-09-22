import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { childFromRequest } from "@/lib/family/request";
import { loadPythonProgress, savePythonProgress } from "@/lib/python/progress-store";

vi.mock("@/lib/family/request", () => ({ childFromRequest: vi.fn() }));
vi.mock("@/lib/python/progress-store", () => ({ loadPythonProgress: vi.fn(), savePythonProgress: vi.fn(), deletePythonProgress: vi.fn() }));

const url = "http://localhost/api/study/python-progress";
const child = { id: "child-one", grade: 6 };

describe("Python practice progress route", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.mocked(childFromRequest).mockResolvedValue(child as never); });

  it("requires a signed-in Class VI child", async () => {
    vi.mocked(childFromRequest).mockResolvedValueOnce(null);
    expect((await GET(new Request(url))).status).toBe(401);
    vi.mocked(childFromRequest).mockResolvedValueOnce({ id: "other", grade: 5 } as never);
    expect((await GET(new Request(url))).status).toBe(401);
    expect(loadPythonProgress).not.toHaveBeenCalled();
  });

  it("loads only the authenticated child's answers", async () => {
    vi.mocked(loadPythonProgress).mockResolvedValue([{ questionId: "q-041", answer: "print('Spy')", checked: false, passed: true }]);
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    expect(loadPythonProgress).toHaveBeenCalledWith("child-one");
    expect((await response.json()).entries[0].questionId).toBe("q-041");
  });

  it("rejects unknown questions and saves a valid program answer for that child", async () => {
    const invalid = await PUT(new Request(url, { method: "PUT", body: JSON.stringify({ questionId: "q-999", answer: "x", checked: false, passed: true }) }));
    expect(invalid.status).toBe(400);
    expect(savePythonProgress).not.toHaveBeenCalled();
    const answer = { questionId: "q-041", answer: "print('Spy')", checked: false, passed: true };
    vi.mocked(savePythonProgress).mockResolvedValue(answer);
    const response = await PUT(new Request(url, { method: "PUT", body: JSON.stringify(answer) }));
    expect(response.status).toBe(200);
    expect(savePythonProgress).toHaveBeenCalledWith("child-one", answer);
  });

  it("accepts progress for an added practice program", async () => {
    const answer = { questionId: "q-059", answer: "print('Positive')", checked: false, passed: true };
    vi.mocked(savePythonProgress).mockResolvedValue(answer);
    const response = await PUT(new Request(url, { method: "PUT", body: JSON.stringify(answer) }));
    expect(response.status).toBe(200);
    expect(savePythonProgress).toHaveBeenCalledWith("child-one", answer);
  });
});
