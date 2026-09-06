import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { getFamilyWorkspace, listScoreAppeals, resolveScoreAppeal, isParentAuthorized, parentAuthConfigured } = vi.hoisted(() => ({
  getFamilyWorkspace: vi.fn(), listScoreAppeals: vi.fn(), resolveScoreAppeal: vi.fn(), isParentAuthorized: vi.fn(), parentAuthConfigured: vi.fn(),
}));
vi.mock("@/lib/family/store", () => ({ getFamilyWorkspace }));
vi.mock("@/lib/learning/appeals", () => ({ listScoreAppeals, resolveScoreAppeal }));
vi.mock("@/lib/parent-auth", () => ({ isParentAuthorized, parentAuthConfigured }));

import { GET, PATCH } from "./route";

describe("/api/parent/score-appeals", () => {
  beforeEach(() => {
    vi.clearAllMocks(); parentAuthConfigured.mockReturnValue(true); isParentAuthorized.mockReturnValue(true);
    getFamilyWorkspace.mockResolvedValue({ family: { id: "family" }, parent: { displayName: "Parent" } });
  });

  it("does not expose another family without parent authentication", async () => {
    isParentAuthorized.mockReturnValue(false);
    expect((await GET(new Request("http://localhost/api/parent/score-appeals"))).status).toBe(401);
    expect(listScoreAppeals).not.toHaveBeenCalled();
  });

  it("scopes the queue and resolution to the parent family", async () => {
    listScoreAppeals.mockResolvedValue({ pending: [], resolved: [] });
    expect((await GET(new Request("http://localhost/api/parent/score-appeals"))).status).toBe(200);
    expect(listScoreAppeals).toHaveBeenCalledWith("family");

    resolveScoreAppeal.mockResolvedValue({ appealId: "appeal", earnedMarks: 2 });
    const response = await PATCH(new Request("http://localhost/api/parent/score-appeals", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ appealId: "appeal", earnedMarks: 2, comment: "Both points are present." }),
    }));
    expect(response.status).toBe(200);
    expect(resolveScoreAppeal).toHaveBeenCalledWith({ appealId: "appeal", familyId: "family", resolverName: "Parent", earnedMarks: 2, comment: "Both points are present." });
  });
});
