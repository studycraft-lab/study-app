"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TutorBoard } from "./tutor-board";
import { AppHeader } from "./app-header";
import { MAX_PACK_BYTES, validateLessonPack } from "@/lib/tutor/validate";
import type { LessonPack } from "@/lib/tutor/types";
import type { TutorPackRow } from "@/lib/tutor/content-store";

type Chapter = { id: string; title: string; courses: { board: string; grade: number; subject: string } };
export function ParentTutorLibrary() {
  const [packs, setPacks] = useState<TutorPackRow[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pack, setPack] = useState<LessonPack | null>(null);
  const [chapterId, setChapterId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [preview, setPreview] = useState<TutorPackRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/parent/tutor"); const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setPacks(data.packs); setChapters(data.chapters);
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
      else { setPreview(null); setMessage(action === "publish" ? "Lesson published for eligible children." : "Lesson archived. Saved lessons remain available to finish."); }
      await load();
    });
  }
  return <main className="study-shell"><AppHeader role="parent" /><Link href="/parent/library">Back to content</Link><h1>Tutoring lessons</h1>
    <p>Prepare one textbook section outside StudyCraft, then upload, review and publish it. <Link href="/parent/library/tutor">Refresh lessons</Link></p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <label>Lesson JSON <input type="file" accept=".json,application/json" disabled={busy} onChange={event => {
      const file = event.target.files?.[0]; setPack(null); setConfirmed(false);
      if (file) void run(async () => {
        if (file.size > MAX_PACK_BYTES || !file.name.toLowerCase().endsWith(".json")) throw new Error("Choose a JSON file no larger than 256 KiB.");
        const result = validateLessonPack(JSON.parse(await file.text()));
        if (!result.valid) throw new Error(result.errors.join("\n"));
        setPack(result.pack);
      });
    }} /></label>
    {pack && <section aria-label="Import details"><h2>{pack.section.heading}</h2><p>{pack.source.board} · Grade {pack.source.grade} · {pack.source.chapterTitle}</p><p>Printed pages: {pack.section.printedPages.join(", ")}. PDF pages: {pack.section.pdfPages.join(", ") || "Not supplied"}.</p><p>{pack.scenes.length} scenes · {pack.steps.length} checkpoints · Source review: {pack.source.sourceStatus}</p><ul>{pack.goals.map(goal => <li key={goal}>{goal}</li>)}</ul>
      <label>Existing chapter <select value={chapterId} onChange={e => { setChapterId(e.target.value); setConfirmed(false); }}><option value="">Choose chapter</option>{chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.courses.board} · Grade {ch.courses.grade} · {ch.courses.subject} · {ch.title}</option>)}</select></label>
      <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I confirm this chapter and exact section: {pack.section.path.join(" / ")}</label>
      <button disabled={busy || !confirmed || !chapterId} onClick={() => void run(async () => {
        const response = await fetch("/api/parent/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pack, chapterId, mappingConfirmed: confirmed }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.errors?.join("\n") ?? data.error);
        setMessage(data.created ? "Draft imported. Preview it before publication." : "This version is already imported."); setPack(null); await load();
      })}>Import draft</button></section>}
    <section aria-label="Saved lessons"><h2>Saved lessons</h2>{packs.map(row => <article key={row.id}><h3>{row.heading} · v{row.content_version}</h3><p>{row.chapter_title} · {row.status}</p><button disabled={busy} onClick={() => void action(row, "preview")}>Preview {row.heading} v{row.content_version}</button>{row.status === "draft" && <button disabled={busy || !row.previewed_at} onClick={() => void action(row, "publish")}>Publish {row.heading} v{row.content_version}</button>}{row.status !== "archived" && <button disabled={busy} onClick={() => void action(row, "archive")}>Archive {row.heading} v{row.content_version}</button>}</article>)}</section>
    {preview && <section aria-label="Scripted lesson preview"><h2>{preview.heading}: scripted preview</h2><p>No voice API is used. Review each explanation and answer against the source before publishing. </p>{preview.payload.steps.map(step => <article key={step.id}><h3>{step.narration}</h3><p>{step.simplerExplanation}</p><TutorBoard scene={preview.payload.scenes.find(scene => scene.id === step.sceneId)!} /><p>{step.checkpoint.prompt}</p><ul>{step.checkpoint.options.map(o => <li key={o.id}>{o.text}{o.id === step.checkpoint.correctOptionId ? " (answer)" : ""}</li>)}</ul><p>Hint: {step.checkpoint.hint}</p><p>Feedback: {step.checkpoint.encouragement}</p></article>)}<p>{preview.payload.recap.text}</p><button onClick={() => setPreview(null)}>Close preview</button></section>}
  </main>;
}
