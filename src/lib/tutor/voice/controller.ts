import "server-only";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import WebSocket from "ws";
import { commandProgress, type TutorChild } from "../progress-store";
import type { LessonPack } from "../types";
import type { TutorState } from "../state";
import { TutorVoiceEvents } from "./events";
import { VoiceDeadlines } from "./deadlines";
import { activeVoiceSessions, updateVoice, voiceContext } from "./store";
import { createRealtimeCall, hangupRealtimeCall, realtimeSessionConfig, VoiceProviderError } from "./provider";
import { voiceConfig } from "./config";
import { uuid } from "../http";

type Call = { id: string; providerId?: string; sdp?: string; socket?: WebSocket; pack: LessonPack; state: TutorState; child: TutorChild; progressId: string; deadline: number; closed: boolean; learnerTurn: number; boundaryTurn: number; usage: number; responseIds: Set<string>; bridge?: TutorVoiceEvents };
export class VoiceController {
  private calls = new Map<string, Call>();
  private starts = new Map<string, Promise<{ sdp: string }>>();
  private deadlines = new VoiceDeadlines();
  private sweeping = false;
  private modelCheckUntil = 0;
  async healthy() {
    if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_SECRET_KEY || !process.env.TUTOR_CONTROLLER_SECRET) return false;
    if (Date.now() < this.modelCheckUntil) return true;
    const response = await fetch(`https://api.openai.com/v1/models/${encodeURIComponent(voiceConfig().model)}`, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },signal: AbortSignal.timeout(10000) });
    if (!response.ok) return false;
    await activeVoiceSessions(); this.modelCheckUntil = Date.now()+300000; return true;
  }
  async start(id: string, sdp: string) {
    const running = this.starts.get(id); if (running) return running;
    const existing = this.calls.get(id); if (existing?.sdp && !existing.closed) return { sdp: existing.sdp };
    const task = this.setup(id,sdp); this.starts.set(id,task);
    try { return await task; } finally { this.starts.delete(id); }
  }
  private async setup(id: string, sdp: string) {
    if (process.env.TUTOR_ENABLED !== "true" || process.env.TUTOR_LIVE_ENABLED !== "true" || !await this.healthy()) throw new Error("Controller unavailable");
    const context = await voiceContext(id);
    if (context.session.status !== "reserved" || context.session.model !== voiceConfig().model || Date.parse(context.session.deadline) <= Date.now()) throw new Error("Reservation unavailable");
    const call: Call = { id,pack: context.pack,state: context.progress.state,child: context.child,progressId: context.progress.id,deadline: Date.parse(context.session.deadline),closed: false,learnerTurn: 0,boundaryTurn: 0,usage: 0,responseIds: new Set() };
    this.calls.set(id,call);
    this.deadlines.schedule(id,call.deadline,() => this.end(id,"allowance"),() => undefined);
    try {
      const created = await createRealtimeCall({ childId: call.child.id,sdp,pack: call.pack,state: call.state });
      call.providerId = created.callId; call.sdp = created.sdp;
      await updateVoice(id,{ provider_call_id: created.callId });
      if (call.closed || Date.now() >= call.deadline) { await this.end(id,"ended_during_setup"); throw new Error("Session ended"); }
      await this.attach(call);
      if (call.closed) throw new Error("Session ended");
      await updateVoice(id,{ status: "active" });
      if (call.closed) { await this.end(id,"ended_during_setup"); throw new Error("Session ended"); }
      return { sdp: created.sdp };
    } catch (error) {
      if (error instanceof VoiceProviderError && error.callId) { call.providerId = error.callId; await updateVoice(id,{ provider_call_id: error.callId }); }
      if (call.providerId) await this.end(id,"setup_failed").catch(() => undefined);
      else {
        call.closed = true;
        const definitelyNotCreated = error instanceof VoiceProviderError && ["quota","unconfigured"].includes(error.code);
        await updateVoice(id,{ status: definitelyNotCreated ? "failed" : "termination_pending",error_class: definitelyNotCreated ? error.code : "setup_unknown" });
        this.calls.delete(id); this.deadlines.cancel(id);
      }
      throw new Error("Voice setup failed");
    }
  }
  private async attach(call: Call) {
    const socket = new WebSocket(`wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(call.providerId!)}`,{ headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
    call.socket = socket;
    const policy = realtimeSessionConfig(call.pack,call.state);
    const send = (event: unknown) => { if (!call.closed && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event)); };
    call.bridge = new TutorVoiceEvents(() => ({ state: call.state,stepId: call.pack.steps[call.state.stepIndex].id }),async command => {
      if (call.closed || Date.now() >= call.deadline) throw new Error("Session ended");
      // Understanding, answers and continuation each need a new learner turn in their phase.
      if (["ask_checkpoint","record_checkpoint","retry","continue","finish_lesson"].includes(command.name) && call.learnerTurn <= call.boundaryTurn) throw new Error("Wait for the learner");
      const previous = call.state.phase;
      const updated = await commandProgress(call.child,call.progressId,command,"model");
      call.state = updated.progress.state;
      if (call.state.phase !== previous) call.boundaryTurn = call.learnerTurn;
      return { state: call.state };
    },send,async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        if (call.closed) throw new Error("Call ended");
        const row = (await activeVoiceSessions(call.child.id)).find(s => s.id === call.id);
        if (row && row.ui_revision >= call.state.revision) return;
        await new Promise(resolve => setTimeout(resolve,500));
      }
      await this.end(call.id,"board_ack_timeout");
      throw new Error("Board acknowledgement timed out");
    });
    await new Promise<void>((resolve,reject) => {
      let confirmed = false;
      const timeout = setTimeout(() => { socket.terminate(); reject(new Error("Sideband timeout")); },10000);
      socket.on("open",() => send({ type: "session.update",session: policy }));
      socket.on("message",raw => {
        if (call.closed || Buffer.byteLength(raw.toString()) > 200000) return;
        let event: Record<string, unknown>; try { event = JSON.parse(raw.toString()); } catch { return; }
        if (event.type === "session.updated") {
          const session = event.session as { instructions?: string; model?: string } | undefined;
          const expected = policy;
          // Browser-side policy/model overrides end the call instead of becoming authority.
          if (session?.model !== expected.model) { void this.end(call.id,"policy_changed").catch(() => undefined); return; }
          if (!confirmed) {
            if (session?.instructions !== expected.instructions) { socket.terminate(); clearTimeout(timeout); reject(new Error("Policy mismatch")); return; }
            confirmed = true; clearTimeout(timeout); resolve();
          } else if (session?.instructions !== expected.instructions) void this.end(call.id,"policy_changed").catch(() => undefined);
        }
        if (event.type === "input_audio_buffer.speech_stopped") { call.learnerTurn++; send({ type: "response.create" }); }
        if (event.type === "conversation.item.created") {
          const item = event.item as { role?: string; content?: { type?: string }[] } | undefined;
          if (item?.role === "user" && item.content?.some(c => c.type === "input_text")) { call.learnerTurn++; call.bridge!.interrupt(); send({ type: "response.create" }); }
        }
        if (event.type === "response.done") {
          const response = event.response as { id?: string; usage?: { total_tokens?: number } } | undefined;
          if (response?.id && !call.responseIds.has(response.id) && Number.isSafeInteger(response.usage?.total_tokens) && Number(response.usage?.total_tokens)>=0) {
            call.responseIds.add(response.id); call.usage += response.usage!.total_tokens!;
          }
        }
        void call.bridge!.receive(event).catch(() => { void this.end(call.id,"event_error").catch(() => undefined); });
      });
      socket.on("error",() => { clearTimeout(timeout); if (!confirmed) reject(new Error("Sideband connection failed")); void this.end(call.id,"sideband_error").catch(() => undefined); });
      socket.on("close",() => { clearTimeout(timeout); if (!confirmed) reject(new Error("Sideband closed")); if (!call.closed) void this.end(call.id,"sideband_closed").catch(() => undefined); });
    });
  }
  async end(id: string, reason = "ended") {
    const call = this.calls.get(id);
    if (call) { call.closed = true; call.socket?.close(); this.deadlines.cancel(id); }
    const session = (await activeVoiceSessions()).find(s => s.id === id);
    if (!session) { this.calls.delete(id); return; }
    const providerId = call?.providerId ?? session.provider_call_id;
    await updateVoice(id,{ status: "termination_pending",error_class: reason });
    if (!providerId) return; // Unknown setup outcome remains occupied for operator reconciliation.
    await hangupRealtimeCall(providerId);
    await updateVoice(id,{ status: "ended",ended_at: new Date().toISOString(),provider_usage: call?.responseIds.size ? { total_tokens: call.usage,measured: true } : null });
    this.calls.delete(id);
  }
  async reconcile() {
    if (this.sweeping) return; this.sweeping = true;
    try {
      for (const session of await activeVoiceSessions()) {
        let permitted = true;
        try { await voiceContext(session.id); } catch { permitted = false; }
        const disabled = process.env.TUTOR_ENABLED !== "true" || process.env.TUTOR_LIVE_ENABLED !== "true";
        if (disabled || !permitted || session.status === "termination_pending" || Date.parse(session.deadline)<=Date.now() || !this.calls.has(session.id) && session.provider_call_id) await this.end(session.id,disabled || !permitted ? "disabled" : "recovery").catch(() => undefined);
      }
    } finally { this.sweeping = false; }
  }
  async shutdown() { this.deadlines.clear(); await Promise.allSettled([...this.calls.keys()].map(id => this.end(id,"controller_shutdown"))); }
}

function authorized(request: IncomingMessage) {
  const expected = process.env.TUTOR_CONTROLLER_SECRET; const supplied = request.headers.authorization;
  return !!expected && !!supplied && timingSafeEqual(createHash("sha256").update(`Bearer ${expected}`).digest(),createHash("sha256").update(supplied).digest());
}
export function createControllerServer(controller = new VoiceController()) {
  const server = createServer(async (request: IncomingMessage,response: ServerResponse) => {
    const reply = (status: number,body: unknown) => { response.writeHead(status,{ "content-type": "application/json" }); response.end(JSON.stringify(body)); };
    if (!authorized(request)) { reply(401,{ error: "Unauthorized" }); return; }
    try {
      if (request.method === "GET" && request.url === "/health") { const ready = await controller.healthy(); reply(ready ? 200 : 503,{ protocol: "studycraft-voice-v1",independentDeadlines: ready }); return; }
      if (request.method !== "POST" || !["/calls","/end"].includes(request.url ?? "")) { reply(404,{}); return; }
      let body = "";
      for await (const chunk of request) { body += chunk.toString(); if (Buffer.byteLength(body)>110000) { reply(413,{}); return; } }
      const input = JSON.parse(body);
      if (!uuid(input.voiceId)) { reply(400,{}); return; }
      if (request.url === "/end") { await controller.end(input.voiceId); reply(200,{ ended: true }); return; }
      if (typeof input.sdp !== "string" || !input.sdp.startsWith("v=0") || input.sdp.length>100000) { reply(400,{}); return; }
      reply(200,await controller.start(input.voiceId,input.sdp));
    } catch { reply(503,{ error: "Voice control unavailable" }); }
  });
  return { server,controller };
}
