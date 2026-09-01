import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "studycraft_child_session";
const MAX_AGE = 60 * 60 * 8;

function secret(): string | null {
  return process.env.CHILD_SESSION_SECRET ?? process.env.PARENT_IMPORT_PASSPHRASE ?? null;
}

function signature(payload: string): string | null {
  const value = secret();
  return value ? createHmac("sha256", value).update(payload).digest("base64url") : null;
}

export function childSessionCookie(childId: string): string {
  const payload = `${childId}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  const signed = signature(payload);
  if (!signed) throw new Error("Child sessions are not configured.");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${payload}.${signed}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearChildSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function childIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [childId, expires, provided] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(childId) || !/^\d+$/.test(expires) || Number(expires) <= Math.floor(Date.now() / 1000)) return null;
  const expected = signature(`${childId}.${expires}`);
  if (!expected) return null;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right) ? childId : null;
}
