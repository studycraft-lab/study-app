import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { childPreviewCookie, isChildPreviewAuthorized } from "./child-preview-auth";

describe("child preview authorization", () => {
  afterEach(() => delete process.env.PARENT_IMPORT_PASSPHRASE);

  it("accepts only the signed HttpOnly preview cookie", () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const cookie = childPreviewCookie();
    expect(cookie).toContain("HttpOnly");
    expect(isChildPreviewAuthorized(new Request("http://localhost", { headers: { cookie } }))).toBe(true);
    expect(isChildPreviewAuthorized(new Request("http://localhost", { headers: { cookie: "studycraft_child_preview=wrong" } }))).toBe(false);
  });
});
