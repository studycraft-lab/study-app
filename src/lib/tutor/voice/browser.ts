export type VoiceStatus = "idle" | "permission" | "connecting" | "listening" | "speaking" | "muted" | "autoplay-blocked" | "ended" | "error";
export type BrowserVoicePorts = { microphone: () => Promise<MediaStream>; peer: () => RTCPeerConnection; audio: () => HTMLAudioElement; request: typeof fetch };
const browserPorts = (): BrowserVoicePorts => ({ microphone: () => navigator.mediaDevices.getUserMedia({ audio: true }), peer: () => new RTCPeerConnection(), audio: () => new Audio(), request: fetch });
export class BrowserTutorVoice {
  private generation = 0;
  private stream?: MediaStream;
  private pc?: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private audio?: HTMLAudioElement;
  private abort?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private token?: string;
  constructor(private status: (status: VoiceStatus, message?: string) => void, private event: (event: unknown) => void, private ports: BrowserVoicePorts = browserPorts()) {}
  async start(progressId: string) {
    if (this.token) return;
    const generation = ++this.generation; const token = crypto.randomUUID(); this.token = token;
    this.status("permission"); this.abort = new AbortController();
    this.timer = setTimeout(() => { this.status("error", "Voice setup timed out. You can try again or use rehearsal."); void this.end(false); },30000);
    try {
      const stream = await this.ports.microphone();
      if (generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return; }
      this.stream = stream; const pc = this.ports.peer(); this.pc = pc; const audio = this.ports.audio(); this.audio = audio; audio.autoplay = true;
      pc.ontrack = event => { if (generation !== this.generation) return; audio.srcObject = event.streams[0]; void audio.play().catch(() => { if (generation === this.generation) this.status("autoplay-blocked", "Tap Play voice to allow audio."); }); };
      stream.getTracks().forEach(track => pc.addTrack(track,stream));
      const channel = pc.createDataChannel("oai-events"); this.channel = channel;
      channel.onopen = () => { if (generation === this.generation) { this.status("listening"); this.text("Please begin or resume this teaching step."); } };
      channel.onmessage = event => {
        if (generation !== this.generation || typeof event.data !== "string" || event.data.length > 100000) return;
        try { const data = JSON.parse(event.data); if (data.type === "output_audio_buffer.started") this.status("speaking"); if (["output_audio_buffer.stopped","input_audio_buffer.speech_started"].includes(data.type)) this.status("listening"); this.event(data); } catch { /* Ignore invalid protocol input. */ }
      };
      pc.onconnectionstatechange = () => { if (generation === this.generation && ["failed","disconnected","closed"].includes(pc.connectionState)) { this.status("error","Voice disconnected. Your checkpoint progress is saved; use rehearsal or start again."); void this.end(false); } };
      this.status("connecting"); const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      if (generation !== this.generation) return;
      const response = await this.ports.request("/api/study/tutor/voice", { method: "POST",headers: { "content-type": "application/json" },body: JSON.stringify({ progressId,clientToken: token,sdp: offer.sdp }),signal: this.abort.signal });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Voice is unavailable.");
      if (generation !== this.generation) return;
      if (typeof data.sdp !== "string" || !data.sdp.startsWith("v=0")) throw new Error("Voice setup failed.");
      await pc.setRemoteDescription({ type: "answer",sdp: data.sdp });
      clearTimeout(this.timer);
      const remaining = Date.parse(data.deadline)-Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) throw new Error("Voice session allowance expired.");
      // Convenience cleanup only. The independent server controller owns the actual deadline.
      this.timer = setTimeout(() => { this.status("ended","Voice time is up. Continue with rehearsal."); void this.end(false); },remaining);
    } catch (error) {
      if (generation !== this.generation) return;
      this.status("error", error instanceof DOMException && error.name === "NotAllowedError" ? "Microphone permission was denied. You can use rehearsal." : error instanceof Error ? error.message : "Voice setup failed.");
      await this.end(false);
    }
  }
  send(event: unknown) { if (this.channel?.readyState === "open") this.channel.send(JSON.stringify(event)); }
  interrupt() { if (this.channel?.readyState !== "open") return; this.status("listening"); this.send({ type: "response.cancel" }); this.send({ type: "output_audio_buffer.clear" }); }
  text(value: string) { if (!value.trim() || value.length > 500) return; this.interrupt(); this.send({ type: "conversation.item.create",item: { type: "message",role: "user",content: [{ type: "input_text",text: value.trim() }] } }); }
  mute(muted: boolean) { if (!this.stream) return; this.stream?.getAudioTracks().forEach(t => t.enabled = !muted); if (muted) this.interrupt(); this.status(muted ? "muted" : "listening"); }
  async acknowledge(revision: number) {
    if (!this.token) return;
    const response = await this.ports.request("/api/study/tutor/voice",{ method: "PATCH",headers: { "content-type": "application/json" },body: JSON.stringify({ clientToken: this.token,revision }),signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Board acknowledgement failed.");
  }
  async play() { const generation = this.generation; if (!this.audio) return; try { await this.audio.play(); if (generation === this.generation) this.status("listening"); } catch { if (generation === this.generation) this.status("autoplay-blocked","Audio is still blocked. Check this browser's audio permission."); } }
  async end(notify = true) {
    const generation = ++this.generation; clearTimeout(this.timer); this.abort?.abort();
    this.channel?.close(); this.pc?.close(); this.stream?.getTracks().forEach(t => t.stop());
    if (this.audio) { this.audio.pause(); this.audio.srcObject = null; }
    this.channel = undefined; this.pc = undefined; this.stream = undefined; this.audio = undefined;
    const token = this.token; this.token = undefined;
    if (notify) this.status("ended");
    if (token) {
      try { const response = await this.ports.request("/api/study/tutor/voice",{ method: "DELETE",headers: { "content-type": "application/json" },body: JSON.stringify({ clientToken: token }),keepalive: true,signal: AbortSignal.timeout(5000) }); if (!response.ok && generation === this.generation) this.status("error","Microphone stopped. Server termination is awaiting confirmation; the controller retains the session limit."); }
      catch { if (generation === this.generation) this.status("error","Microphone stopped. Server termination is awaiting confirmation; the controller retains the session limit."); }
    }
  }
}
