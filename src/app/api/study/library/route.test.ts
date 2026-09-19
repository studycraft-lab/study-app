import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ child: vi.fn(), library: vi.fn(), coverage: vi.fn(), from: vi.fn(), select: vi.fn(), in: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: mocks.child }));
vi.mock("@/lib/question-bank/store", () => ({ listLibrary: mocks.library }));
vi.mock("@/lib/learning/store", () => ({ chapterCoverage: mocks.coverage }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({ from: mocks.from }) }));
import { GET } from "./route";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED", "true");
  mocks.child.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
  mocks.library.mockResolvedValue([{ id: "eligible-bank", chapterTitle: "The Cell" }]);
  mocks.coverage.mockResolvedValue({ "eligible-bank": { coveragePercent: 40 } });
  mocks.from.mockReturnValue({ select: mocks.select }); mocks.select.mockReturnValue({ in: mocks.in });
  mocks.in.mockResolvedValue({ data: [{ id: "eligible-bank", chapter_id: "cell" }], error: null });
});
afterEach(() => vi.unstubAllEnvs());
it("maps only the authenticated child's eligible banks and preserves exercise coverage", async () => {
  const response = await GET(new Request("http://localhost/api/study/library"));
  expect(mocks.library).toHaveBeenCalledWith({ familyId: "family", board: "ICSE", grade: 6 });
  expect(mocks.in).toHaveBeenCalledWith("id", ["eligible-bank"]);
  expect((await response.json()).chapters[0]).toEqual({ id: "eligible-bank", chapterTitle: "The Cell", tutorChapterId: "cell", coveragePercent: 40 });
});
it("does not query tutoring mappings when disabled", async () => {
  vi.stubEnv("TUTOR_ENABLED", "false");
  expect((await GET(new Request("http://localhost/api/study/library"))).status).toBe(200);
  expect(mocks.from).not.toHaveBeenCalled();
});
it("rejects anonymous requests before reading chapter mappings", async () => {
  mocks.child.mockResolvedValue(null);
  expect((await GET(new Request("http://localhost/api/study/library"))).status).toBe(401);
  expect(mocks.from).not.toHaveBeenCalled();
});
it("keeps exercises available if tutoring chapter lookup fails", async () => {
  mocks.in.mockResolvedValue({ data: null, error: { message: "Unavailable" } });
  const response = await GET(new Request("http://localhost/api/study/library"));
  expect(response.status).toBe(200);
  expect((await response.json()).chapters[0]).toEqual({ id: "eligible-bank", chapterTitle: "The Cell", coveragePercent: 40 });
});
