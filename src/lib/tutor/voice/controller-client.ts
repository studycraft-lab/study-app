import "server-only";
import { TutorError } from "../http";
export async function controllerRequest(path: string, body?: unknown) {
  const base = process.env.TUTOR_CONTROLLER_URL; const token = process.env.TUTOR_CONTROLLER_SECRET;
  if (!base || !token) throw new TutorError("The voice controller is not configured.", 503);
  const url = new URL(base);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) throw new TutorError("Voice controller requires HTTPS.", 503);
  try {
    const response = await fetch(new URL(path, url), { method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25000), cache: "no-store" });
    if (!response.ok) throw new TutorError("Voice setup or termination could not be confirmed. Try rehearsal.", 503);
    return await response.json();
  } catch (error) { if (error instanceof TutorError) throw error; throw new TutorError("Voice controller unavailable. Try rehearsal.", 503); }
}
