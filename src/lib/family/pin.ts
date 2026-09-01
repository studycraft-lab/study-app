import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function validPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4,8}$/.test(pin);
}

export function hashPin(pin: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("base64url");
  return { salt, hash: scryptSync(pin, salt, 32).toString("base64url") };
}

export function verifyPin(pin: string, salt: string, expected: string): boolean {
  const actual = scryptSync(pin, salt, 32);
  const stored = Buffer.from(expected, "base64url");
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}
