import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { childFromRequest, reportQuestion } = vi.hoisted(() => ({ childFromRequest: vi.fn(), reportQuestion: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest }));
vi.mock("@/lib/question-bank/reports", () => ({ reportQuestion }));

import { POST } from "./route";

describe("POST /api/study/question-reports", () => {
  afterEach(() => vi.clearAllMocks());

  it("stores a report against the signed-in child and attempt", async () => {
    const child = { id: "child", familyId: "family", displayName: "Asha", board: "ICSE", grade: 6 };
    childFromRequest.mockResolvedValue(child);
    reportQuestion.mockResolvedValue("report");
    const response = await POST(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId: "attempt" }) }));
    expect(response.status).toBe(201);
    expect(reportQuestion).toHaveBeenCalledWith({ child, attemptId: "attempt", note: undefined });
  });
});
