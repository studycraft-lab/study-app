import { beforeEach, describe, expect, it, vi } from "vitest";
import pack from "../../../../../examples/lesson-packs/synthetic-shapes.json";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ requested: vi.fn(), publish: vi.fn(), authorized: vi.fn(), family: vi.fn(), import: vi.fn(), manage: vi.fn(), list: vi.fn(), chapters: vi.fn() }));
vi.mock("@/lib/parent-auth", () => ({ isParentAuthorized: mocks.authorized }));
vi.mock("@/lib/family/store", () => ({ ensureFamily: mocks.family }));
vi.mock("@/lib/tutor/content-store", () => ({ importTutorPack: mocks.import, manageTutorPack: mocks.manage, parentTutorPacks: mocks.list, tutorChapters: mocks.chapters }));
vi.mock("@/lib/tutor/preparation", () => ({ importRequestedPack: mocks.requested, publishRequestedPack: mocks.publish }));
import { GET, POST, PATCH } from "./route";
import { TutorError } from "@/lib/tutor/http";
const chapterId = "11111111-1111-1111-1111-111111111111";
const request = (body: unknown, type = "application/json") => new Request("http://localhost/api/parent/tutor", { method: "POST", headers: { "content-type": type }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED", "true"); mocks.authorized.mockReturnValue(true); mocks.family.mockResolvedValue({ id: "family-a" }); mocks.import.mockResolvedValue({ id: "pack-id", created: true }); mocks.list.mockResolvedValue([]); mocks.chapters.mockResolvedValue([]); });
describe("parent tutoring boundary (mocked persistence)", () => {
  it.each([GET, POST, PATCH])("rejects unauthenticated and child callers before data access", async handler => {
    mocks.authorized.mockReturnValue(false); expect((await handler(request({}))).status).toBe(401); expect(mocks.family).not.toHaveBeenCalled();
  });
  it("honours the off-by-default flag", async () => { vi.stubEnv("TUTOR_ENABLED", "false"); expect((await GET(request({}))).status).toBe(503); });
  it("uses server family identity and ignores supplied ownership", async () => {
    expect((await POST(request({ pack, chapterId, mappingConfirmed: true, familyId: "intruder" }))).status).toBe(201);
    expect(mocks.import).toHaveBeenCalledWith("family-a", chapterId, pack);
  });
  it("scopes list reads to the parent's family", async () => { await GET(request({})); expect(mocks.list).toHaveBeenCalledWith("family-a"); });
  it("invalid packs create nothing and report paths", async () => {
    const response = await POST(request({ pack: { ...pack, schemaVersion: "99" }, chapterId, mappingConfirmed: true }));
    expect(response.status).toBe(422); expect((await response.json()).errors[0]).toContain("/schemaVersion"); expect(mocks.import).not.toHaveBeenCalled();
  });
  it("requires explicit mapping confirmation", async () => { expect((await POST(request({ pack, chapterId }))).status).toBe(422); expect(mocks.import).not.toHaveBeenCalled(); });
  it("reports an idempotent reimport", async () => { mocks.import.mockResolvedValue({ id: "same", created: false }); const result = await POST(request({ pack, chapterId, mappingConfirmed: true })); expect(result.status).toBe(200); expect(await result.json()).toEqual({ id: "same", created: false }); });
  it("reports immutable-version collisions", async () => { mocks.import.mockRejectedValue(new TutorError("Increase contentVersion.", 409)); expect((await POST(request({ pack, chapterId, mappingConfirmed: true }))).status).toBe(409); });
  it("limits actual bytes without trusting content-length", async () => { expect((await POST(request({ pad: "x".repeat(280000) }))).status).toBe(413); expect(mocks.import).not.toHaveBeenCalled(); });
  it("rejects non-JSON uploads", async () => { expect((await POST(request({}, "text/html"))).status).toBe(415); });
  it("scopes publication to server family", async () => { await PATCH(request({ id: chapterId, action: "publish", familyId: "other" })); expect(mocks.publish).toHaveBeenCalledWith("family-a", chapterId); });
});

it("imports for the server-owned request without manual mapping", async () => {
  mocks.requested.mockResolvedValue({id:"pack",created:true});
  expect((await POST(request({requestId:chapterId,pack,familyId:"other"}))).status).toBe(201);
  expect(mocks.requested).toHaveBeenCalledWith("family-a",chapterId,pack);
  expect(mocks.import).not.toHaveBeenCalled();
});
