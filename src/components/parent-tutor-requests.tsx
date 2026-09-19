"use client";
import { useCallback, useEffect, useState } from "react";
import type { TutorPackRow } from "@/lib/tutor/content-store";
import type { TutorChapter, TutorRequest } from "@/lib/tutor/request-store";
import { MAX_PACK_BYTES, validateLessonPack } from "@/lib/tutor/validate";

type Library = { requests: TutorRequest[]; chapters: TutorChapter[] };
export function ParentTutorRequests({ packs, onPreview, onUploaded, onFocus }: { packs: TutorPackRow[]; onPreview: (pack: TutorPackRow) => void; onUploaded: (id: string) => Promise<void>; onFocus: (active: boolean) => void }) {
  const [library,setLibrary] = useState<Library | null>(null);
  const [selected,setSelected] = useState<string | null>(null);
  const [prompt,setPrompt] = useState("");
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/parent/tutor/requests"); const data = await response.json();
    if (!response.ok) throw new Error(data.error); setLibrary(data);
  },[]);
  useEffect(() => { void Promise.resolve().then(load).catch(e => setError(e.message)); },[load]);
  const request = library?.requests.find(r => r.id === selected);
  const chapter = library?.chapters.find(ch => ch.id === request?.chapter_id);
  const linked = packs.find(p => p.id === request?.pack_id);
  async function open(row: TutorRequest) {
    setSelected(row.id); onFocus(true); setPrompt(""); setError(""); setMessage(""); setBusy(true);
    try {
      const response = await fetch(`/api/parent/tutor/preparation?requestId=${encodeURIComponent(row.id)}`); const data = await response.json();
      if (!response.ok) throw new Error(data.error); setPrompt(data.prompt);
    } catch(cause) { setError(cause instanceof Error ? cause.message : "Could not load the prompt."); }
    finally {setBusy(false);}
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setMessage("Prompt copied. Paste it into Codex and attach the textbook PDF."); }
    catch { setError("Clipboard unavailable. Open the prompt below and copy its text."); }
  }
  async function upload(file: File) {
    if (!request) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (file.size > MAX_PACK_BYTES || !file.name.toLowerCase().endsWith(".json")) throw new Error("Choose the lesson.json file from Codex, no larger than 256 KiB.");
      let input: unknown;
      try {input=JSON.parse(await file.text());} catch {throw new Error("This is not a valid lesson JSON file. Ask Codex to return lesson.json, without surrounding text.");}
      const validated = validateLessonPack(input);
      if(!validated.valid) throw new Error(`Ask Codex to fix these lesson-file errors, then upload again:\n${validated.errors.join("\n")}`);
      const response = await fetch("/api/parent/tutor",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({requestId:request.id,pack:validated.pack})});
      const data = await response.json(); if(!response.ok) throw new Error(data.errors?.join("\n") ?? data.error);
      await load(); await onUploaded(data.id);
    } catch(cause) {setError(cause instanceof Error ? cause.message : "Upload failed. Please try again.");}
    finally {setBusy(false);}
  }
  return <section className="parent-tutor-panel request-workflow" aria-label="Lesson requests">
    {error && <p className="notice notice-error" role="alert" style={{whiteSpace:"pre-wrap"}}>{error}</p>}
    {message && <p role="status">{message}</p>}
    {request ? <>
      <button className="button-quiet" disabled={busy} onClick={() => {setSelected(null);onFocus(false);setError("");}}>← All requests</button>
      <p className="eyebrow">{chapter?.courses.subject} · {chapter?.title}</p><h2>Prepare {request.proposed_heading}</h2>
      <p>Requested by {request.child_profiles?.display_name ?? "your child"}{request.page_reference ? ` · Page ${request.page_reference}` : ""}</p>
      {request.note && <blockquote>{request.note}</blockquote>}
      <ol className="preparation-steps">
        <li><h3>Prepare the lesson in Codex</h3><p>Copy the prompt into Codex and attach the textbook PDF there. The prompt includes this request and the lesson format.</p>
          <button disabled={busy || !prompt} onClick={() => void copyPrompt()}>{busy ? "Loading…" : "Copy Codex prompt"}</button>
          <details className="tutor-help"><summary>View or copy the prompt manually</summary><textarea aria-label="Codex preparation prompt" value={prompt} readOnly rows={8} /></details>
        </li>
        <li><h3>Upload the lesson from Codex</h3><p>Save the lesson.json file Codex returns, then upload it here. We’ll check it belongs to this request.</p>
          <label className="lesson-upload">Lesson file<input type="file" accept=".json,application/json" disabled={busy || !prompt} onChange={e => {const file=e.target.files?.[0];e.target.value="";if(file) void upload(file);}} /></label>
          {linked && <p>A lesson is already uploaded. <button disabled={busy} onClick={() => onPreview(linked)}>Preview uploaded lesson</button></p>}
        </li>
        <li><h3>Preview and publish</h3><p>After upload, check the diagrams and questions. Publish when ready; your child’s request will automatically show the lesson.</p></li>
      </ol>
    </> : <>
      <h2>Requests from your children</h2><p>Open a request, prepare its lesson in Codex, then upload and publish it here.</p>
      {!library && <p role="status">Loading requests…</p>}
      {library && !library.requests.length && <p>No requests yet. Your child can request a lesson from a chapter’s tutoring page.</p>}
      <div className="parent-lesson-grid">{library?.requests.filter(r => r.status !== "declined").map(row => {
        const ch=library.chapters.find(c => c.id===row.chapter_id); const saved=packs.find(p=>p.id===row.pack_id);
        return <article className="parent-lesson-card" key={row.id}><span className="tutor-badge">{row.available ? "Ready for child" : saved ? "Lesson uploaded" : "Needs a lesson"}</span><p className="eyebrow">{ch?.courses.subject} · {ch?.title}</p><h3>{row.proposed_heading}</h3><p>{row.child_profiles?.display_name ?? "Your child"}{row.page_reference ? ` · Page ${row.page_reference}` : ""}</p>{row.note && <p>{row.note}</p>}{saved ? <button onClick={() => onPreview(saved)}>{row.available ? "View lesson" : "Preview and publish"}</button> : <button onClick={() => void open(row)}>Prepare lesson</button>}{saved && !row.available && <button className="button-quiet" onClick={() => void open(row)}>Replace uploaded file</button>}</article>;
      })}</div>
      {library?.requests.some(r=>r.status==='declined') && <details className="tutor-help"><summary>Closed requests</summary>{library.requests.filter(r=>r.status==='declined').map(r=><p key={r.id}>{r.proposed_heading}: {r.reason}</p>)}</details>}
    </>}
  </section>;
}
