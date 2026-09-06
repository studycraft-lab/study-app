import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { childFromRequest, createScoreAppeal } = vi.hoisted(() => ({ childFromRequest: vi.fn(), createScoreAppeal: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest }));
vi.mock("@/lib/learning/appeals", () => ({ createScoreAppeal }));

import { POST } from "./route";

describe("POST /api/study/score-appeals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a child session", async () => {
    childFromRequest.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost/api/study/score-appeals", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
  });

  it("creates an appeal only for the signed-in child", async () => {
    const child = { id: "child", familyId: "family", displayName: "Asha" };
    childFromRequest.mockResolvedValue(child);
    createScoreAppeal.mockResolvedValue({ id: "appeal", status: "pending" });
    const response = await POST(new Request("http://localhost/api/study/score-appeals", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ attemptId: "attempt", comment: "I included both points." }),
    }));
    expect(response.status).toBe(201);
    expect(createScoreAppeal).toHaveBeenCalledWith({ child, attemptId: "attempt", comment: "I included both points." });
  });
});
