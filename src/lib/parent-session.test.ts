import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { clearParentSessionCookie, hasParentSession, parentSessionCookie } from "./parent-session";

describe("parent session", () => {
  afterEach(() => { delete process.env.PARENT_IMPORT_PASSPHRASE; });
  it("uses a signed HttpOnly cookie and rejects tampering", () => {
    process.env.PARENT_IMPORT_PASSPHRASE = "secret";
    const cookie = parentSessionCookie();
    expect(cookie).toContain("HttpOnly");
    expect(hasParentSession(new Request("http://localhost", { headers: { cookie } }))).toBe(true);
    expect(hasParentSession(new Request("http://localhost", { headers: { cookie: cookie.replace("studycraft_parent_session=", "studycraft_parent_session=x") } }))).toBe(false);
    expect(clearParentSessionCookie()).toContain("Max-Age=0");
  });
});
