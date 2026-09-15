// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only",() => ({}));
const mocks = vi.hoisted(() => ({ active: vi.fn(),context: vi.fn(),update: vi.fn(),hangup: vi.fn() }));
vi.mock("./store",() => ({ activeVoiceSessions: mocks.active,voiceContext: mocks.context,updateVoice: mocks.update }));
vi.mock("./provider",async importOriginal => ({ ...await importOriginal<typeof import("./provider")>(),hangupRealtimeCall: mocks.hangup }));
import { VoiceController } from "./controller";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("TUTOR_ENABLED","true"); vi.stubEnv("TUTOR_LIVE_ENABLED","true"); mocks.context.mockResolvedValue({}); mocks.hangup.mockResolvedValue(undefined); mocks.update.mockResolvedValue(undefined); });
it("recovers a known provider call after controller restart independently of its browser", async () => {
  mocks.active.mockResolvedValue([{ id: "voice",status: "active",provider_call_id: "rtc_call",deadline: new Date(Date.now()+10000).toISOString() }]);
  await new VoiceController().reconcile();
  expect(mocks.hangup).toHaveBeenCalledWith("rtc_call"); expect(mocks.update).toHaveBeenCalledWith("voice",expect.objectContaining({ status: "ended",provider_usage: null }));
});
it("keeps termination pending when hangup fails", async () => {
  mocks.active.mockResolvedValue([{ id: "voice",status: "termination_pending",provider_call_id: "rtc_call",deadline: new Date().toISOString() }]); mocks.hangup.mockRejectedValue(new Error());
  await new VoiceController().reconcile();
  expect(mocks.update).toHaveBeenCalledWith("voice",expect.objectContaining({ status: "termination_pending" })); expect(mocks.update.mock.calls.some(([,value]) => value.status === "ended")).toBe(false);
});
it("does not falsely close an unknown setup outcome", async () => {
  mocks.active.mockResolvedValue([{ id: "voice",status: "termination_pending",provider_call_id: null,deadline: new Date().toISOString() }]);
  await new VoiceController().reconcile(); expect(mocks.hangup).not.toHaveBeenCalled(); expect(mocks.update.mock.calls.some(([,value]) => value.status === "ended")).toBe(false);
});
it("protects the controller HTTP boundary and never returns internal error details", async () => {
  const { createControllerServer } = await import("./controller");
  vi.stubEnv("TUTOR_CONTROLLER_SECRET","test-private-secret");
  const controller = new VoiceController(); const health = vi.spyOn(controller,"healthy").mockRejectedValue(new Error("test-private-secret"));
  const { server } = createControllerServer(controller);
  const invoke = (authorization?: string) => new Promise<{ status: number; body: string }>(resolve => {
    let status = 0;
    server.emit("request",{ method: "GET",url: "/health",headers: { authorization } },{ writeHead: (value: number) => { status = value; },end: (body: string) => resolve({ status,body }) });
  });
  expect((await invoke()).status).toBe(401); expect(health).not.toHaveBeenCalled();
  const result = await invoke("Bearer test-private-secret"); expect(result.status).toBe(503); expect(result.body).not.toContain("test-private-secret");
});
