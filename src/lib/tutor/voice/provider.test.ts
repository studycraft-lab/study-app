import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import fixture from "../../../../examples/lesson-packs/synthetic-shapes.json";
import { validateLessonPack } from "../validate";
import { initialTutorState } from "../state";
import { createRealtimeCall, hangupRealtimeCall, realtimeSessionConfig } from "./provider";
import { voiceConfig, voiceUnavailableReason } from "./config";
const validation = validateLessonPack(fixture); if (!validation.valid) throw new Error();
const input = { childId: "child-private-id",sdp: "v=0\r\n",pack: validation.pack,state: initialTutorState() };
beforeEach(() => { vi.stubEnv("OPENAI_API_KEY","fake-test-key"); vi.stubEnv("OPENAI_REALTIME_MODEL","test-model"); vi.stubGlobal("fetch",vi.fn()); });
it("exchanges SDP with server-selected model and keeps the key out of its result", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response("v=0\r\nanswer",{ headers: { location: "/v1/realtime/calls/rtc_test" } }));
  const result = await createRealtimeCall(input);
  expect(result).toEqual({ callId: "rtc_test",sdp: "v=0\r\nanswer" });
  const request = vi.mocked(fetch).mock.calls[0][1]!;
  expect(request.headers).toMatchObject({ Authorization: "Bearer fake-test-key" });
  expect(JSON.stringify(request.headers)).not.toContain(input.childId);
  const session = JSON.parse(String((request.body as FormData).get("session")));
  expect(session.model).toBe("test-model"); expect(session.instructions).toContain("untrusted content"); expect(session.instructions).toContain(fixture.facts[0].text);
  expect(JSON.stringify(result)).not.toContain("fake-test-key");
});
it.each([429,500,401])("sanitises provider status %s", async status => {
  vi.mocked(fetch).mockResolvedValue(new Response("secret-provider-details",{ status }));
  await expect(createRealtimeCall(input)).rejects.not.toThrow("secret-provider-details");
});
it("retains a known call ID for cleanup when SDP is invalid", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response("invalid",{ headers: { location: "/v1/realtime/calls/rtc_bad" } }));
  await expect(createRealtimeCall(input)).rejects.toMatchObject({ code: "invalid_response",callId: "rtc_bad" });
});
it("uses supported server hangup and treats an already-closed call idempotently", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null,{ status: 404 })); await hangupRealtimeCall("rtc_test");
  expect(fetch).toHaveBeenCalledWith("https://api.openai.com/v1/realtime/calls/rtc_test/hangup",expect.objectContaining({ method: "POST" }));
  await expect(hangupRealtimeCall("../escape")).rejects.toThrow();
});
it("retains the provider call ID when reading its SDP fails", async () => {
  const response = new Response(null,{ headers: { location: "/v1/realtime/calls/rtc_interrupted" } });
  vi.spyOn(response,"text").mockRejectedValue(new Error("connection lost"));
  vi.mocked(fetch).mockResolvedValue(response);
  await expect(createRealtimeCall(input)).rejects.toMatchObject({ code: "timeout",callId: "rtc_interrupted" });
});
it("disables live mode for missing credentials and unverified controller setup", () => {
  vi.stubEnv("TUTOR_ENABLED","true"); vi.stubEnv("TUTOR_LIVE_ENABLED","true"); vi.stubEnv("OPENAI_API_KEY",""); expect(voiceUnavailableReason()).toContain("not configured");
  vi.stubEnv("OPENAI_API_KEY","fake"); vi.stubEnv("TUTOR_CONTROLLER_VERIFIED","false"); expect(voiceUnavailableReason()).toContain("verification");
  vi.stubEnv("TUTOR_SESSION_SECONDS","999999"); expect(voiceConfig().sessionSeconds).toBe(600); expect(realtimeSessionConfig(input.pack,input.state).audio.input.turn_detection.create_response).toBe(false);
});
