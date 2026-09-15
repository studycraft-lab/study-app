import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authorized: vi.fn(),family: vi.fn(),permission: vi.fn(),set: vi.fn() }));
vi.mock("@/lib/parent-auth", () => ({ isParentAuthorized: mocks.authorized }));
vi.mock("@/lib/family/store", () => ({ ensureFamily: mocks.family }));
vi.mock("@/lib/tutor/voice/store", () => ({ voicePermission: mocks.permission,setVoicePermission: mocks.set }));
import { GET, PATCH } from "./route";
beforeEach(() => { vi.clearAllMocks(); mocks.authorized.mockReturnValue(true); mocks.family.mockResolvedValue({ id: "own-family" }); mocks.permission.mockResolvedValue(false); });
const request = (body: unknown) => new Request("http://localhost/api/parent/tutor/voice",{ method: "PATCH",headers: { "Content-Type": "application/json" },body: JSON.stringify(body) });
it("requires parent authorization before reading or changing live permission", async () => {
  mocks.authorized.mockReturnValue(false);
  expect((await GET(new Request("http://localhost"))).status).toBe(401);
  expect((await PATCH(request({ enabled: true }))).status).toBe(401);
  expect(mocks.family).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
});
it("uses the authenticated family and rejects invalid settings", async () => {
  expect((await PATCH(request({ enabled: "yes" }))).status).toBe(400); expect(mocks.set).not.toHaveBeenCalled();
  expect((await PATCH(request({ enabled: false,familyId: "another-family" }))).status).toBe(200);
  expect(mocks.set).toHaveBeenCalledWith("own-family",false);
});
