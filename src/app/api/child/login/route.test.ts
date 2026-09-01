import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ authenticateChildByName: vi.fn(), childSessionCookie: vi.fn(() => "child=session") }));
vi.mock("@/lib/family/store", () => ({ authenticateChildByName: mocks.authenticateChildByName }));
vi.mock("@/lib/family/session", () => ({ childSessionCookie: mocks.childSessionCookie }));

import { POST } from "./route";

describe("POST /api/child/login", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.authenticateChildByName.mockResolvedValue({ id: "11111111-1111-1111-1111-111111111111", displayName: "Asha", board: "ICSE", grade: 6, active: true }); });

  it("allows a child to sign in without a prior parent or trusted-device session", async () => {
    const response = await POST(new Request("http://localhost/api/child/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName: "Asha", pin: "1234" }) }));

    expect(response.status).toBe(200);
    expect(mocks.authenticateChildByName).toHaveBeenCalledWith("Asha", "1234");
  });
});
