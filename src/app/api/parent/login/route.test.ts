import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { POST } from "./route";

describe("parent login", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; });
  it("exchanges the family password for parent and trusted-device cookies", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const response = await POST(new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passphrase: "secret" }) }));
    expect(response.status).toBe(200);
    const cookies = response.headers.getSetCookie().join(";");
    expect(cookies).toContain("studycraft_parent_session=");
    expect(cookies).toContain("studycraft_child_preview=");
    expect(cookies).toContain("HttpOnly");
  });
});
