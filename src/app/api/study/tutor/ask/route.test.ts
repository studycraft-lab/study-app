import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ child: vi.fn(), load: vi.fn(), reserve: vi.fn(), answer: vi.fn() }));
vi.mock("@/lib/family/request", () => ({ childFromRequest: mocks.child }));
vi.mock("@/lib/tutor/progress-store", () => ({ loadProgress: mocks.load }));
vi.mock("@/lib/tutor/section-question", () => ({ answerSectionQuestion: mocks.answer }));
vi.mock("@/lib/tutor/section-question-usage", () => ({ reserveSectionQuestion: mocks.reserve }));
import { POST } from "./route";

const id = "11111111-1111-1111-1111-111111111111";
const child = { id: "child-a", familyId: "family-a", board: "ICSE", grade: 6 };
const pack = { section: { heading: "Plastids" } };
const request = (body: unknown) => new Request("http://localhost/api/study/tutor/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED", "true"); mocks.child.mockResolvedValue(child); mocks.load.mockResolvedValue({ pack }); mocks.reserve.mockResolvedValue(undefined); mocks.answer.mockResolvedValue({ kind: "answered", answer: "Three types.", pages: ["38"] }); });

it("requires an authenticated child before looking up a saved lesson", async () => {
  mocks.child.mockResolvedValue(null);
  expect((await POST(request({ progressId: id, question: "What are plastids?" }))).status).toBe(401);
  expect(mocks.load).not.toHaveBeenCalled();
});

it("loads only the signed-in child's lesson and ignores client-supplied pack or child IDs", async () => {
  const response = await POST(request({ progressId: id, question: "  What are plastids?  ", childId: "sibling", pack: { facts: ["fake"] } }));
  expect(response.status).toBe(200);
  expect(mocks.load).toHaveBeenCalledWith(child, id);
  expect(mocks.reserve).toHaveBeenCalledWith(child.id, id);
  expect(mocks.answer).toHaveBeenCalledWith(pack, child.id, "What are plastids?");
});

it("rejects empty and oversized questions before the provider call", async () => {
  expect((await POST(request({ progressId: id, question: "  " }))).status).toBe(400);
  expect((await POST(request({ progressId: id, question: "x".repeat(301) }))).status).toBe(400);
  expect(mocks.answer).not.toHaveBeenCalled();
});

it("does not call the model when the child's question allowance is exhausted", async () => {
  mocks.reserve.mockRejectedValue(new Error("limit"));
  expect((await POST(request({ progressId: id, question: "What are plastids?" }))).status).toBe(503);
  expect(mocks.answer).not.toHaveBeenCalled();
});
