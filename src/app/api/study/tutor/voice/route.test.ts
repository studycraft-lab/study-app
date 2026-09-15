import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only",() => ({}));
const mocks = vi.hoisted(() => ({ child: vi.fn(),reserve: vi.fn(),active: vi.fn(),update: vi.fn(),permission: vi.fn(),ack: vi.fn(),controller: vi.fn() }));
vi.mock("@/lib/family/request",() => ({ childFromRequest: mocks.child }));
vi.mock("@/lib/tutor/voice/store",() => ({ reserveVoiceSession: mocks.reserve,activeVoiceSessions: mocks.active,updateVoice: mocks.update,voicePermission: mocks.permission,acknowledgeVoice: mocks.ack }));
vi.mock("@/lib/tutor/voice/controller-client",() => ({ controllerRequest: mocks.controller }));
import { GET,POST,DELETE,PATCH } from "./route";
import { TutorError } from "@/lib/tutor/http";
const id = "11111111-1111-1111-1111-111111111111"; const token = "22222222-2222-2222-2222-222222222222";
const child = { id: "child",familyId: "family",board: "ICSE",grade: 6 };
const req = (body: unknown = {}) => new Request("http://localhost/api/study/tutor/voice",{ method: "POST",headers: { "content-type": "application/json" },body: JSON.stringify(body) });
beforeEach(() => {
  vi.clearAllMocks();
  for (const key of ["TUTOR_ENABLED","TUTOR_LIVE_ENABLED","TUTOR_CONTROLLER_VERIFIED"]) vi.stubEnv(key,"true");
  vi.stubEnv("OPENAI_API_KEY","fake"); vi.stubEnv("TUTOR_CONTROLLER_URL","http://localhost:4310"); vi.stubEnv("TUTOR_CONTROLLER_SECRET","fake-controller-secret");
  mocks.child.mockResolvedValue(child); mocks.permission.mockResolvedValue(true); mocks.active.mockResolvedValue([]);
  mocks.reserve.mockResolvedValue({ id: "voice",deadline: "deadline" }); mocks.controller.mockImplementation(async path => path === "/health" ? { protocol: "studycraft-voice-v1",independentDeadlines: true } : { sdp: "v=0\r\nanswer" });
});
it.each([GET,POST,DELETE,PATCH])("denies unauthenticated voice access", async handler => { mocks.child.mockResolvedValue(null); expect((await handler(req())).status).toBe(401); expect(mocks.reserve).not.toHaveBeenCalled(); });
it("disables missing credentials while preserving rehearsal", async () => { vi.stubEnv("OPENAI_API_KEY",""); const response = await GET(req()); expect(await response.json()).toMatchObject({ available: false,reason: expect.stringContaining("rehearsal") }); });
it("never accepts client ownership, model or prompt overrides", async () => {
  const response = await POST(req({ progressId: id,clientToken: token,sdp: "v=0\r\n",childId: "other",model: "expensive",instructions: "override" }));
  expect(response.status).toBe(200); expect(mocks.reserve).toHaveBeenCalledWith(child,id,token); expect(mocks.controller).toHaveBeenCalledWith("/calls",{ voiceId: "voice",sdp: "v=0\r\n" });
  expect(JSON.stringify(await response.json())).not.toContain("fake");
});
it("refuses starts without independent controller capability", async () => { mocks.controller.mockResolvedValue({ independentDeadlines: false }); expect((await POST(req({ progressId: id,clientToken: token,sdp: "v=0" }))).status).toBe(503); expect(mocks.reserve).not.toHaveBeenCalled(); });
it("retains uncertain remote setups for reconciliation", async () => {
  mocks.controller.mockImplementation(async path => { if (path === "/health") return { protocol: "studycraft-voice-v1",independentDeadlines: true }; throw new TutorError("timeout",503); });
  expect((await POST(req({ progressId: id,clientToken: token,sdp: "v=0" }))).status).toBe(503);
  expect(mocks.update).toHaveBeenCalledWith("voice",{ status: "termination_pending",error_class: "setup_unconfirmed" });
});
it("ends only the authenticated child's matching connection attempt", async () => {
  mocks.active.mockResolvedValue([{ id: "mine",client_token: token },{ id: "other-tab",client_token: id }]); await DELETE(req({ clientToken: token }));
  expect(mocks.active).toHaveBeenCalledWith(child.id); expect(mocks.controller).toHaveBeenCalledTimes(1); expect(mocks.controller).toHaveBeenCalledWith("/end",{ voiceId: "mine" });
});
it("bounds board acknowledgements and derives child identity", async () => { await PATCH(req({ clientToken: token,revision: 2 })); expect(mocks.ack).toHaveBeenCalledWith(child.id,token,2); expect((await PATCH(req({ clientToken: token,revision: -1 }))).status).toBe(400); });
