import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "studycraft_child_preview";

function token(): string | null {
  const secret = process.env.PARENT_IMPORT_PASSPHRASE;
  return secret ? createHmac("sha256", secret).update("studycraft:child-preview:v1").digest("base64url") : null;
}

export function childPreviewCookie(): string {
  const value = token();
  if (!value) throw new Error("Child preview is not configured.");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=28800; HttpOnly; SameSite=Lax${secure}`;
}

export function clearChildPreviewCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

export function isChildPreviewAuthorized(request: Request): boolean {
  const expected = token();
  const cookie = request.headers.get("cookie") ?? "";
  const provided = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}
