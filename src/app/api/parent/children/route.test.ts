import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { createChild } = vi.hoisted(() => ({ createChild: vi.fn() }));
vi.mock("@/lib/family/store", () => ({ createChild, updateChild: vi.fn() }));

import { POST } from "./route";

describe("POST /api/parent/children", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("requires the parent and creates a grade-tagged child", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const unauthorized = await POST(new Request("http://localhost", { method: "POST", body: "{}" }));
    expect(unauthorized.status).toBe(401);
    createChild.mockResolvedValue({ id: "child", displayName: "Asha", board: "ICSE", grade: 6, active: true });
    const response = await POST(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" }, body: JSON.stringify({ displayName: "Asha", board: "ICSE", grade: 6, pin: "1234" }) }));
    expect(response.status).toBe(201);
    expect(createChild).toHaveBeenCalledWith({ displayName: "Asha", board: "ICSE", grade: 6, pin: "1234" });
  });
});
