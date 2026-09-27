import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ chapters: vi.fn(), from: vi.fn(), sign: vi.fn(), storage: vi.fn() }));
vi.mock("./content-store", () => ({ tutorChapters: mocks.chapters }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({ from: mocks.from, storage: { from: mocks.storage } }) }));
import { videoLessons, videoPlayback, setVideoStatus } from "./video-store";
const child = { id: "child", familyId: "family", board: "icse", grade: 6 };
const chapters = [
  { id: "eligible", title: "Poem", courses: { board: "ICSE", grade: 6, subject: "English Literature" } },
  { id: "other-grade", title: "Other", courses: { board: "ICSE", grade: 7, subject: "English Literature" } },
  { id: "other-board", title: "Other", courses: { board: "CBSE", grade: 6, subject: "English Literature" } },
];
const rows = [
  { id: "video", chapter_id: "eligible", title: "Poem", duration_seconds: "675.4", status: "published", asset_prefix: "private/published" },
  { id: "draft", chapter_id: "eligible", status: "draft", asset_prefix: "private/draft" },
  { id: "archived", chapter_id: "eligible", status: "archived", asset_prefix: "private/archived" },
  { id: "foreign", chapter_id: "foreign", status: "published", asset_prefix: "private/foreign" },
  { id: "older", chapter_id: "other-grade", status: "published", asset_prefix: "private/older" },
];
beforeEach(() => {
  vi.clearAllMocks(); mocks.chapters.mockResolvedValue(chapters);
  mocks.storage.mockReturnValue({ createSignedUrls: mocks.sign });
  mocks.sign.mockResolvedValue({ data: ["video", "poster", "captions"].map(name => ({ signedUrl: `https://storage.test/${name}` })), error: null });
  mocks.from.mockImplementation(() => {
    let selected = [...rows];
    const query = {
      select: () => query, order: () => query,
      in: (_key: string, ids: string[]) => { selected = selected.filter(row => ids.includes(row.chapter_id)); return query; },
      eq: (key: string, value: string) => { selected = selected.filter(row => row[key as keyof typeof row] === value); return query; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: selected, error: null }).then(resolve),
    };
    return query;
  });
});
it("only lists the authenticated family's published videos for the child's board and grade", async () => {
  const lessons = await videoLessons(child.familyId, child);
  expect(mocks.chapters).toHaveBeenCalledWith("family");
  expect(lessons.map(lesson => lesson.id)).toEqual(["video"]);
  expect(lessons[0]).toMatchObject({ duration_seconds: 675.4, subject: "English Literature" });
  expect(lessons[0]).not.toHaveProperty("asset_prefix");
});
it.each(["draft", "archived", "foreign", "older", "missing"])("never signs media for an ineligible video: %s", async id => {
  await expect(videoPlayback("family", id, child)).rejects.toMatchObject({ status: 404 });
  expect(mocks.sign).not.toHaveBeenCalled();
});
it("signs only server-owned paths after authorization", async () => {
  expect(await videoPlayback("family", "video", child)).toMatchObject({ videoUrl: "https://storage.test/video" });
  expect(mocks.storage).toHaveBeenCalledWith("tutor-videos");
  expect(mocks.sign).toHaveBeenCalledWith(["private/published/lesson.mp4", "private/published/poster.jpg", "private/published/captions.en.vtt"], 7200);
});
it("allows parent previews of drafts but rejects foreign-family management", async () => {
  expect((await videoPlayback("family", "draft")).lesson.id).toBe("draft");
  await expect(setVideoStatus("family", "foreign", "published")).rejects.toMatchObject({ status: 404 });
});
it("reports missing assets without returning a broken player", async () => {
  mocks.sign.mockResolvedValue({ data: [{ signedUrl: null, error: "Missing" }], error: null });
  await expect(videoPlayback("family", "video", child)).rejects.toMatchObject({ status: 503 });
});
