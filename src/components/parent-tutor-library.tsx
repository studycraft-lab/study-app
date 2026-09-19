"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ParentVoicePermission } from "./tutor-voice-controls";
import { ParentTutorRequests } from "./parent-tutor-requests";
import { TutorPlayer } from "./tutor-player";
import { AppHeader } from "./app-header";
import { validateLessonPack } from "@/lib/tutor/validate";
import type { TutorPackRow } from "@/lib/tutor/content-store";

export function ParentTutorLibrary() {
  const [packs, setPacks] = useState<TutorPackRow[]>([]);
  const [preparing,setPreparing] = useState(false);
  const [preview, setPreview] = useState<TutorPackRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/parent/tutor"); const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setPacks(data.packs); return data.packs as TutorPackRow[];
  }, []);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  async function run(task: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await task(); } catch (e) { setError(e instanceof Error ? e.message : "Lesson action failed."); } finally { setBusy(false); }
  }
  async function action(row: TutorPackRow, action: "preview" | "publish" | "archive") {
    await run(async () => {
      const result = validateLessonPack(row.payload);
      if (!result.valid) throw new Error(result.errors.join("\n"));
      const response = await fetch("/api/parent/tutor", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id, action }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (action === "preview") setPreview(row);
      else { setPreview(null); setPreparing(false); setMessage(action === "publish" ? "Published for your child. Linked requests are ready to open." : "Lesson archived. Saved lessons remain available to finish."); }
      await load();
    });
  }
  const subjects = [...new Set(packs.map(row => row.payload.source.subject))].sort();
  const visiblePacks = packs.filter(row => !subject || row.payload.source.subject === subject);
  const previewRow = preview && (packs.find(row => row.id === preview.id) ?? preview);
  return <main className="parent-shell parent-tutor"><AppHeader role="parent" />
    <header className="parent-intro"><p className="eyebrow">Parent workspace</p><h1>{preview ? preview.heading : "Tutoring lessons"}</h1><p>{preview ? "Review the lesson your child will see, then publish when it is ready." : "Prepare a requested lesson in Codex, upload it here, then publish it for your child."}</p></header>
    <nav className="content-tabs" aria-label="Content type"><Link href="/parent/library">Practice questions</Link><Link href="/parent/library/tutor" aria-current="page">Tutoring lessons</Link></nav>
    {error && <p className="notice notice-error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    {preview && previewRow ? <section className="parent-preview" aria-label="Scripted lesson preview">
      <div className="parent-preview-toolbar"><button className="button-quiet" onClick={() => {setPreview(null);setPreparing(false);}}>← Back to lessons</button><span className="tutor-badge">{previewRow.status === "published" ? "Visible to children" : previewRow.status === "draft" ? "Draft · not visible to children" : "Archived"}</span>{previewRow.status === "draft" && <button disabled={busy || !previewRow.previewed_at} onClick={() => void action(previewRow, "publish")} aria-label={`Publish ${preview.heading} v${preview.content_version}`}>Publish for child</button>}</div>
      <p className="preview-note">No voice API is used. This preview shows the diagrams, explanations and questions.</p>
      <TutorPlayer key={preview.id} pack={preview.payload} />
    </section> : <>
    <ParentTutorRequests key={packs.map(p => `${p.id}:${p.status}`).join(",")} packs={packs} onFocus={setPreparing} onPreview={row => void action(row,"preview")} onUploaded={async id => {const updated=await load();const row=updated.find(p=>p.id===id);if(!row) throw new Error("Uploaded lesson could not be loaded. Refresh and try preview again.");await action(row,"preview");}} />
    {!preparing && <section className="parent-tutor-panel" aria-label="Saved lessons"><div className="parent-panel-heading"><div><h2>Lesson library</h2><p>Preview a draft before publishing it for your child.</p></div>{subjects.length > 1 && <label>Subject<select value={subject} onChange={e => setSubject(e.target.value)}><option value="">All subjects</option>{subjects.map(name => <option key={name}>{name}</option>)}</select></label>}</div>
      {!packs.length && <p>No lessons yet. Open a child’s request above to prepare one.</p>}
      {[...new Set(visiblePacks.map(row => row.chapter_id ?? row.chapter_title))].map(chapterKey => {
        const rows = visiblePacks.filter(row => (row.chapter_id ?? row.chapter_title) === chapterKey);
        const first = rows[0];
        return <section className="parent-lesson-chapter" key={chapterKey}><p className="eyebrow">{first.payload.source.subject} · {first.payload.source.board} · Grade {first.payload.source.grade}</p><h3>{first.chapter_title}</h3><div className="parent-lesson-grid">{rows.map(row => <article className="parent-lesson-card" key={row.id}><span className="tutor-badge">{row.status === "published" ? "Published" : row.status === "draft" ? "Draft" : "Archived"}</span><h4>{row.heading}</h4><p>Version {row.content_version} · {row.payload.steps.length} teaching steps</p><p>{row.status === "published" ? "Available in your child’s chapter." : row.status === "draft" ? "Only you can see this until it is published." : "Saved progress is still available to children."}</p><div className="button-row"><button disabled={busy} onClick={() => void action(row, "preview")}>Preview {row.heading} v{row.content_version}</button>{row.status === "draft" && <button className="button-secondary" disabled={busy || !row.previewed_at} onClick={() => void action(row, "publish")}>Publish {row.heading} v{row.content_version}</button>}</div>{row.status !== "archived" && <details className="tutor-help"><summary>Manage version</summary><p>Archiving hides this version from new learners. Existing progress is kept.</p><button className="button-quiet" disabled={busy} onClick={() => void action(row, "archive")}>Archive {row.heading} v{row.content_version}</button></details>}</article>)}</div></section>;
      })}
    </section>}
    <details className="parent-tutor-panel"><summary>Voice settings</summary><ParentVoicePermission /></details>
    </>}
  </main>;
}
