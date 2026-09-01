import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { hasParentSession } from "./parent-session";

const HEADER_NAME = "x-studycraft-parent-passphrase";

export function isParentAuthorized(request: Request): boolean {
  return hasParentSession(request) || isParentPassphrase(request.headers.get(HEADER_NAME));
}

export function isParentPassphrase(provided: string | null): boolean {
  const expected = process.env.PARENT_IMPORT_PASSPHRASE;

  if (!expected || !provided) return false;

  const expectedHash = createHash("sha256").update(expected).digest();
  const providedHash = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedHash, providedHash);
}

export function parentAuthConfigured(): boolean {
  return Boolean(process.env.PARENT_IMPORT_PASSPHRASE);
}
