import { afterEach, expect, it, vi } from "vitest";
import { BrowserTutorVoice, type BrowserVoicePorts } from "./browser";
afterEach(() => vi.useRealTimers());
function setup() {
  const track = { stop: vi.fn(),enabled: true }; const stream = { getTracks: () => [track],getAudioTracks: () => [track] } as unknown as MediaStream;
  const channel = { readyState: "open",send: vi.fn(),close: vi.fn(),onopen: null as (() => void) | null,onmessage: null as ((event: { data: string }) => void) | null };
  const peer = { ontrack: null as ((e: { streams: MediaStream[] }) => void) | null,onconnectionstatechange: null as (() => void) | null,connectionState: "connected",addTrack: vi.fn(),createDataChannel: () => channel,createOffer: vi.fn().mockResolvedValue({ sdp: "v=0\r\n" }),setLocalDescription: vi.fn().mockResolvedValue(undefined),setRemoteDescription: vi.fn().mockResolvedValue(undefined),close: vi.fn() };
  const audio = { autoplay: false,srcObject: null,play: vi.fn().mockResolvedValue(undefined),pause: vi.fn() };
  const request = vi.fn(async (_url: unknown, init?: RequestInit) => init?.method === "DELETE" ? Response.json({ ended: true }) : Response.json({ sdp: "v=0\r\nanswer",deadline: new Date(Date.now()+600000).toISOString() }));
  const ports: BrowserVoicePorts = { microphone: vi.fn().mockResolvedValue(stream),peer: vi.fn(() => peer as unknown as RTCPeerConnection),audio: () => audio as unknown as HTMLAudioElement,request: request as typeof fetch };
  const status = vi.fn(); const event = vi.fn(); const voice = new BrowserTutorVoice(status,event,ports);
  return { track,stream,channel,peer,audio,ports,request,status,event,voice };
}
it("cleans tracks, peer and audio and scopes end to its own start token", async () => {
  const s = setup(); await s.voice.start("progress-id"); s.channel.onopen!(); s.voice.mute(true); expect(s.track.enabled).toBe(false);
  s.voice.text("What does this mean?"); expect(s.channel.send).toHaveBeenCalledWith(expect.stringContaining("input_text"));
  await s.voice.end(); expect(s.track.stop).toHaveBeenCalledOnce(); expect(s.peer.close).toHaveBeenCalledOnce(); expect(s.audio.pause).toHaveBeenCalledOnce();
  const start = JSON.parse(s.request.mock.calls.find(c => c[1]?.method === "POST")![1]!.body as string);
  const end = JSON.parse(s.request.mock.calls.find(c => c[1]?.method === "DELETE")![1]!.body as string);
  expect(end.clientToken).toBe(start.clientToken); expect(start).not.toHaveProperty("model"); expect(start).not.toHaveProperty("instructions");
});
it("stops a microphone granted after cancellation and never creates a peer", async () => {
  const s = setup(); let resolve!: (stream: MediaStream) => void;
  vi.mocked(s.ports.microphone).mockReturnValue(new Promise(r => { resolve = r; }));
  const started = s.voice.start("progress"); await s.voice.end(); resolve(s.stream); await started;
  expect(s.track.stop).toHaveBeenCalledOnce(); expect(s.ports.peer).not.toHaveBeenCalled();
});
it("recovers from denied microphone without attempting a provider session", async () => {
  const s = setup(); vi.mocked(s.ports.microphone).mockRejectedValue(new DOMException("Denied","NotAllowedError")); await s.voice.start("progress");
  expect(s.status).toHaveBeenCalledWith("error",expect.stringContaining("permission was denied")); expect(s.request.mock.calls.some(c => c[1]?.method === "POST")).toBe(false);
});
it("reports autoplay blocking and disconnection without silently reconnecting", async () => {
  const s = setup(); s.audio.play.mockRejectedValue(new Error()); await s.voice.start("progress"); s.peer.ontrack!({ streams: [s.stream] }); await Promise.resolve();
  expect(s.status).toHaveBeenCalledWith("autoplay-blocked",expect.any(String));
  s.peer.connectionState = "disconnected"; s.peer.onconnectionstatechange!(); await Promise.resolve();
  expect(s.track.stop).toHaveBeenCalledOnce(); expect(s.ports.peer).toHaveBeenCalledOnce();
});
it("handles quota failure and ignores events after end", async () => {
  const s = setup(); s.request.mockImplementation(async (_url,init) => init?.method === "POST" ? Response.json({ error: "Daily allowance reached." },{ status: 429 }) : Response.json({ ended: true })); await s.voice.start("progress");
  expect(s.status).toHaveBeenCalledWith("error","Daily allowance reached."); expect(s.track.stop).toHaveBeenCalledOnce();
  s.channel.onmessage?.({ data: JSON.stringify({ type: "response.done" }) }); expect(s.event).not.toHaveBeenCalled();
});
