import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "./route";

describe("POST /api/child-preview/unlock", () => {
  afterEach(() => delete process.env.PARENT_IMPORT_PASSPHRASE);

  it("exchanges the parent passphrase for a restricted preview cookie", async () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const response = await POST(new Request("http://localhost/api/child-preview/unlock", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passphrase: "secret" }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("studycraft_child_preview=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
