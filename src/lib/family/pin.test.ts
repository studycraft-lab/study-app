import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hashPin, validPin, verifyPin } from "./pin";

describe("child PINs", () => {
  it("accepts only 4–8 digits and stores a salted hash", () => {
    expect(validPin("1234")).toBe(true);
    expect(validPin("12ab")).toBe(false);
    const secured = hashPin("1234");
    expect(secured.hash).not.toContain("1234");
    expect(verifyPin("1234", secured.salt, secured.hash)).toBe(true);
    expect(verifyPin("4321", secured.salt, secured.hash)).toBe(false);
  });
});
