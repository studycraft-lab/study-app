import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const learning = vi.hoisted(() => ({ purgeStudySession: vi.fn() }));
vi.mock("@/lib/learning/store", () => learning);
vi.mock("@/lib/family/store", () => ({ getFamilyWorkspace: vi.fn().mockResolvedValue({ children: [{ id: "child-1" }] }) }));

import { DELETE } from "./route";

describe("DELETE /api/parent/progress/session", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; vi.clearAllMocks(); });

  it("requires a parent and purges only a family child's session", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const unauthorized = await DELETE(new Request("http://localhost", { method: "DELETE", body: "{}" }));
    expect(unauthorized.status).toBe(401);

    const response = await DELETE(new Request("http://localhost", {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" },
      body: JSON.stringify({ childId: "child-1", sessionId: "session-1" }),
    }));

    expect(response.status).toBe(200);
    expect(learning.purgeStudySession).toHaveBeenCalledWith("session-1", "child-1");
  });

  it("rejects a child outside the parent's family", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const response = await DELETE(new Request("http://localhost", {
      method: "DELETE",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": "secret" },
      body: JSON.stringify({ childId: "other-child", sessionId: "session-1" }),
    }));
    expect(response.status).toBe(404);
    expect(learning.purgeStudySession).not.toHaveBeenCalled();
  });
});
