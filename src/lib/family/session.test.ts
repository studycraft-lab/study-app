import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { childIdFromRequest, childSessionCookie } from "./session";

describe("child session", () => {
  afterEach(() => delete process.env.PARENT_IMPORT_PASSPHRASE);

  it("signs the child identity in an HttpOnly cookie", () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const cookie = childSessionCookie(id);
    expect(cookie).toContain("HttpOnly");
    expect(childIdFromRequest(new Request("http://localhost", { headers: { cookie } }))).toBe(id);
    expect(childIdFromRequest(new Request("http://localhost", { headers: { cookie: cookie.replace(id, "223e4567-e89b-12d3-a456-426614174000") } }))).toBeNull();
  });
});
