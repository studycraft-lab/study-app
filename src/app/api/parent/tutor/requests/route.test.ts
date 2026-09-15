import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ auth: vi.fn(), family: vi.fn(), list: vi.fn(), catalogue: vi.fn(), manage: vi.fn() }));
vi.mock("@/lib/parent-auth", () => ({ isParentAuthorized: mocks.auth }));
vi.mock("@/lib/family/store", () => ({ ensureFamily: mocks.family }));
vi.mock("@/lib/tutor/request-store", () => ({ tutorRequestLibrary: mocks.list, catalogueSection: mocks.catalogue, manageRequest: mocks.manage }));
import { GET, POST, PATCH } from "./route";
const id = "11111111-1111-1111-1111-111111111111";
const request = (body: unknown) => new Request("http://localhost/api/parent/tutor/requests", { method: "POST",headers: { "content-type": "application/json" },body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED","true"); mocks.auth.mockReturnValue(true); mocks.family.mockResolvedValue({ id: "parent-family" }); mocks.list.mockResolvedValue({}); });
it.each([GET,POST,PATCH])("denies anonymous or child mutations", async handler => { mocks.auth.mockReturnValue(false); expect((await handler(request({}))).status).toBe(401); expect(mocks.family).not.toHaveBeenCalled(); });
it("passes server family, exact section and published pack identity to lifecycle validation", async () => {
  await PATCH(request({ id,action: "ready",packId: id,reason: "",familyId: "other" }));
  expect(mocks.manage).toHaveBeenCalledWith("parent-family",{ id,action: "ready",sectionId: null,packId: id,reason: "" });
});
it("rejects unsupported status and overlong catalogue text", async () => {
  expect((await PATCH(request({ id,action: "magic",reason: "" }))).status).toBe(400);
  expect((await POST(request({ chapterId: id,key: "plastids",heading: "a".repeat(201),pages: ["38"] }))).status).toBe(400);
  expect(mocks.catalogue).not.toHaveBeenCalled();
});
