import "server-only";
import { MAX_PACK_BYTES } from "./validate";
export class TutorError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function requireTutorEnabled() {
  if (process.env.TUTOR_ENABLED !== "true") throw new TutorError("Tutoring is not enabled yet.", 503);
}
export function tutorError(error: unknown): Response {
  return Response.json({ error: error instanceof TutorError ? error.message : "Tutoring is temporarily unavailable." }, { status: error instanceof TutorError ? error.status : 503 });
}
export const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function readTutorJSON(request: Request, limit = MAX_PACK_BYTES + 4096): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new TutorError("Upload a JSON lesson file.", 415);
  if (Number(request.headers.get("content-length")) > limit) throw new TutorError("Lesson file is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new TutorError("JSON body is missing.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new TutorError("Lesson file is too large.", 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch (error) { if (error instanceof TutorError) throw error; throw new TutorError("Invalid JSON file."); }
  finally { reader.releaseLock(); }
}
