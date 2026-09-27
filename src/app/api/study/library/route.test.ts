import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ child: vi.fn(), library: vi.fn(), coverage: vi.fn(), from: vi.fn(), select: vi.fn(), in: vi.fn(), videos: vi.fn() }));
vi.mock("@/lib/tutor/video-store", () => ({ videoLessons: mocks.videos }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: mocks.child }));
vi.mock("@/lib/question-bank/store", () => ({ listLibrary: mocks.library }));
vi.mock("@/lib/learning/store", () => ({ chapterCoverage: mocks.coverage }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({ from: mocks.from }) }));
import { GET } from "./route";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED", "true");
  mocks.videos.mockResolvedValue([]);
  mocks.child.mockResolvedValue({ id: "child", familyId: "family", board: "ICSE", grade: 6 });
  mocks.library.mockResolvedValue([{ id: "eligible-bank", chapterTitle: "The Cell" }]);
  mocks.coverage.mockResolvedValue({ "eligible-bank": { coveragePercent: 40 } });
  mocks.from.mockReturnValue({ select: mocks.select }); mocks.select.mockReturnValue({ in: mocks.in });
  mocks.in.mockResolvedValue({ data: [{ id: "eligible-bank", chapter_id: "cell" }], error: null });
});
const video = { id: "video", chapter_id: "poem", chapter_title: "A Little Grain of Gold", board: "ICSE", grade: 6, subject: "English Literature" };
it("includes a published video chapter even when no question banks exist", async () => {
  mocks.library.mockResolvedValue([]); mocks.videos.mockResolvedValue([video, { ...video, id: "second-version" }]);
  const body = await (await GET(new Request("http://localhost/api/study/library"))).json();
  expect(body.chapters).toEqual([{ id: "video-poem", tutorChapterId: "poem", chapterTitle: video.chapter_title, board: "ICSE", grade: 6, subject: "English Literature", questionCount: 0, lessonOnly: true }]);
  expect(mocks.videos).toHaveBeenCalledWith("family", expect.objectContaining({ id: "child" }));
});
it("does not duplicate a chapter that has both a video and an exercise", async () => {
  mocks.videos.mockResolvedValue([{ ...video, chapter_id: "cell" }]);
  const body = await (await GET(new Request("http://localhost/api/study/library"))).json();
  expect(body.chapters).toHaveLength(1);
  expect(body.chapters[0].id).toBe("eligible-bank");
});
it("keeps practice working during a video storage outage", async () => {
  mocks.videos.mockRejectedValue(new Error("Unavailable"));
  expect((await GET(new Request("http://localhost/api/study/library"))).status).toBe(200);
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
