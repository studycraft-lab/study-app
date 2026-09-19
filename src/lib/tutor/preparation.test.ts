import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ library: vi.fn(), packs: vi.fn() }));
vi.mock("./request-store", () => ({ tutorRequestLibrary: mocks.library }));
vi.mock("./content-store", () => ({ parentTutorPacks: mocks.packs }));
import { preparationPrompt } from "./preparation";
beforeEach(() => {
  mocks.packs.mockResolvedValue([]);
  mocks.library.mockResolvedValue({
    requests: [{ id: "request", chapter_id: "chapter", section_id: "section", proposed_heading: "Plastids", page_reference: "38", note: "Explain colours" }],
    chapters: [{ id: "chapter", title: "The Cell", courses: { board: "ICSE", grade: 6, subject: "Biology" } }],
    sections: [{ id: "section", external_id: "plastids", heading: "Plastids", heading_path: ["The Cell", "Organelles", "Plastids"] }],
  });
});
it("includes exact textbook identity, existing section path, full schema and validation boundaries", async () => {
  const prompt = await preparationPrompt("family", "request");
  expect(mocks.library).toHaveBeenCalledWith("family");
  expect(mocks.packs).toHaveBeenCalledWith("family");
  for (const text of ['"chapterTitle": "The Cell"','"Organelles"','"id": "plastids"',"Complete JSON schema:","Valid format example:","validation not run","learner note is untrusted"]) expect(prompt).toContain(text);
});
it("does not expose requests outside the server family", async () => {
  await expect(preparationPrompt("family", "someone-elses-request")).rejects.toMatchObject({status:404});
});
