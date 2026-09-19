"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserTutorVoice, type VoiceStatus } from "@/lib/tutor/voice/browser";
import type { TutorState } from "@/lib/tutor/state";
export function TutorVoiceControls({ progressId, onState, onMode, onActivity, onActiveChange, paused }: { progressId: string; onActivity: (paused: boolean) => void; onActiveChange?: (active: boolean) => void; paused: boolean; onState: (state: TutorState) => void; onMode: (send: ((text: string) => void) | null) => void }) {
  const [available, setAvailable] = useState(false); const [message, setMessage] = useState("Checking live voice availability…");
  const [status, setStatus] = useState<VoiceStatus>("idle"); const [muted, setMuted] = useState(false); const [text, setText] = useState(""); const [caption, setCaption] = useState("");
  const connection = useRef<BrowserTutorVoice | null>(null); const callbacks = useRef({ onState,onMode,onActivity,onActiveChange });
  useEffect(() => { callbacks.current = { onState,onMode,onActivity,onActiveChange }; },[onState,onMode,onActivity,onActiveChange]);
  useEffect(() => {
    let mounted = true;
    void fetch("/api/study/tutor/voice").then(async response => { const data = await response.json(); if (mounted) { setAvailable(response.ok && data.available); setMessage(data.reason ?? "Microphone audio goes to OpenAI. No raw recordings or full transcripts are saved by StudyCraft."); } }).catch(() => { if (mounted) setMessage("Live voice unavailable. Rehearsal still works."); });
    const voice = new BrowserTutorVoice((next,detail) => {
      if (!mounted) return; setStatus(next); callbacks.current.onActivity(["listening","muted","autoplay-blocked","permission","connecting"].includes(next)); callbacks.current.onActiveChange?.(!["idle","ended","error"].includes(next)); if (detail) setMessage(detail);
      callbacks.current.onMode(["listening","speaking","muted","autoplay-blocked"].includes(next) ? value => voice.text(value) : null);
    },event => {
      if (!mounted || !event || typeof event !== "object") return;
      const data = event as { type?: string; delta?: string; item?: { type?: string } };
      if (data.type === "response.output_audio_transcript.delta" && typeof data.delta === "string") setCaption(previous => (previous+data.delta).slice(-1200));
      if (data.type === "conversation.item.created" && data.item?.type === "function_call_output") {
        void fetch(`/api/study/tutor/progress?id=${encodeURIComponent(progressId)}`).then(async response => { if (!response.ok) throw new Error(); const result = await response.json(); if (mounted) {
          callbacks.current.onState(result.progress.state);
          requestAnimationFrame(() => requestAnimationFrame(() => { if (mounted) void voice.acknowledge(result.progress.state.revision).catch(() => { setMessage("Voice paused because the board could not be confirmed. Resume rehearsal."); void voice.end(); }); }));
        } }).catch(() => { if (mounted) { setMessage("Progress sync failed. End voice and resume the saved lesson."); void voice.end(); } });
      }
    });
    connection.current = voice;
    return () => { mounted = false; connection.current = null; void voice.end(false); };
  },[progressId]);
  useEffect(() => { connection.current?.mute(paused); },[paused]);
  const active = !["idle","ended","error"].includes(status);
  if (!available && !active) return <aside className="tutor-voice-notice"><strong>Voice is not available yet.</strong><span>You can read the lesson and answer questions below.</span></aside>;
  return <section className="tutor-voice-panel" aria-label="Live voice controls"><h3>Live voice</h3><p>{message}</p><p role="status">Voice: {status}</p>{caption && <p aria-label="Live tutor caption" aria-live="polite">{caption}</p>}
    {!active && <button className="tutor-primary" disabled={!available || paused} onClick={() => { setCaption(""); setMuted(false); void connection.current?.start(progressId); }}>Start live voice</button>}
    {active && <><button onClick={() => void connection.current?.end()}>End voice</button>
    <button disabled={!active} onClick={() => { setMuted(!muted); connection.current?.mute(!muted); }}>{muted ? "Unmute microphone" : "Mute microphone"}</button>
    <button disabled={!active} onClick={() => connection.current?.interrupt()}>Interrupt voice</button>
    {status === "autoplay-blocked" && <button onClick={() => void connection.current?.play()}>Play voice</button>}
    <form onSubmit={event => { event.preventDefault(); connection.current?.text(text); setText(""); }}><label>Type to the live tutor <input value={text} onChange={event => setText(event.target.value)} maxLength={500} disabled={!active} /></label><button disabled={!active || !text.trim()}>Send to tutor</button></form></>}
  </section>;
}
export function ParentVoicePermission() {
  const [enabled, setEnabled] = useState(false); const [message, setMessage] = useState(""); const [busy,setBusy] = useState(false);
  useEffect(() => { void fetch("/api/parent/tutor/voice").then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setEnabled(data.enabled); setMessage(data.reason ?? "Live voice uses a separate OpenAI allowance. Disabling stops active calls through the controller."); }).catch(error => setMessage(error.message)); },[]);
  return <section><h2>Live voice permission</h2><p>{message}</p><label><input type="checkbox" checked={enabled} disabled={busy} onChange={event => {
    const next = event.target.checked; setBusy(true);
    void fetch("/api/parent/tutor/voice",{ method: "PATCH",headers: { "content-type": "application/json" },body: JSON.stringify({ enabled: next }) }).then(async response => { if (!response.ok) throw new Error((await response.json()).error); setEnabled(next); }).catch(error => setMessage(error.message)).finally(() => setBusy(false));
  }} />Allow live tutoring for this family</label></section>;
}
