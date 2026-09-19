import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authorized: vi.fn(), family: vi.fn(), prompt: vi.fn() }));
vi.mock("@/lib/parent-auth", () => ({ isParentAuthorized: mocks.authorized }));
vi.mock("@/lib/family/store", () => ({ ensureFamily: mocks.family }));
vi.mock("@/lib/tutor/preparation", () => ({ preparationPrompt: mocks.prompt }));
import { GET } from "./route";
const id = "11111111-1111-1111-1111-111111111111";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED", "true"); mocks.authorized.mockReturnValue(true); mocks.family.mockResolvedValue({id:"server-family"}); mocks.prompt.mockResolvedValue("prompt"); });
it("requires parent authentication before looking up a request", async () => {
  mocks.authorized.mockReturnValue(false);
  expect((await GET(new Request(`http://localhost?requestId=${id}`))).status).toBe(401);
  expect(mocks.prompt).not.toHaveBeenCalled();
});
it("uses the server family and prevents caching private prompts", async () => {
  const response = await GET(new Request(`http://localhost?requestId=${id}&familyId=other`));
  expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
  expect(mocks.prompt).toHaveBeenCalledWith("server-family",id);
});
