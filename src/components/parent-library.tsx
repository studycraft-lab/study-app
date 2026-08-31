"use client";

import { useState } from "react";
import Link from "next/link";

type Preview = {
  board: string; grade: number; subject: string; bookTitle: string | null;
  chapterNumber: number | null; chapterTitle: string; questionCount: number; sourceCount: number;
};
type LibraryItem = Preview & { id: string; bankVersion: number };

export function ParentLibrary() {
  const [passphrase, setPassphrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState<unknown>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [busy, setBusy] = useState(false);

  const headers = { "content-type": "application/json", "x-studycraft-parent-passphrase": passphrase };

  async function validate() {
    if (!file) return;
    setBusy(true); setErrors([]); setMessage(""); setPreview(null);
    try {
      const parsed = JSON.parse(await file.text());
      const response = await fetch("/api/question-banks/validate", { method: "POST", headers, body: JSON.stringify(parsed) });
      const result = await response.json();
      if (!response.ok) setErrors(result.errors ?? [result.error ?? "Validation failed."]);
      else { setBank(parsed); setPreview(result.preview); setMessage("Valid bank. Confirm the details, then import."); }
    } catch {
      setErrors(["This file is not valid JSON."]);
    } finally { setBusy(false); }
  }

  function update<K extends keyof Preview>(key: K, value: Preview[K]) {
    setPreview((current) => current ? { ...current, [key]: value } : current);
  }

  async function loadLibrary() {
    const response = await fetch("/api/library", { headers: { "x-studycraft-parent-passphrase": passphrase } });
    const result = await response.json();
    if (response.ok) setLibrary(result.chapters);
    else setErrors([result.error ?? "Could not load the library."]);
  }

  async function importBank() {
    if (!bank || !preview) return;
    setBusy(true); setErrors([]);
    const response = await fetch("/api/question-banks/import", { method: "POST", headers, body: JSON.stringify({ bank, metadata: preview }) });
    const result = await response.json();
    if (response.ok) { setMessage(result.created ? "Chapter imported." : "This bank was already imported; nothing was duplicated."); await loadLibrary(); }
    else setErrors(result.errors ?? [result.error ?? "Import failed."]);
    setBusy(false);
  }

  return (
    <main className="parent-shell">
      <header className="parent-header">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link>
        <span className="foundation-badge">Parent preview</span>
      </header>

      <section className="parent-intro">
        <p className="eyebrow">Parent workspace</p>
        <h1>Content library</h1>
        <p>For the MVP, give textbook pages to Codex and ask it to prepare a StudyCraft question-bank JSON. Upload that JSON here. In a later version, the app will accept the pages and use your AI key itself.</p>
      </section>

      <section className="import-card">
        <h2>Import a prepared chapter</h2>
        <label>Parent passphrase<input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label>
        <label>Question-bank JSON<input type="file" accept="application/json,.json" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setBank(null); }} /></label>
        <div className="button-row">
          <button onClick={validate} disabled={!file || !passphrase || busy}>{busy ? "Working…" : "Validate JSON"}</button>
          <button className="button-secondary" onClick={loadLibrary} disabled={!passphrase || busy}>Refresh library</button>
        </div>

        {errors.length > 0 && <div className="notice notice-error" role="alert"><strong>Please fix:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {message && <p className="notice">{message}</p>}

        {preview && <div className="metadata-grid">
          <label>Board<input value={preview.board} onChange={(event) => update("board", event.target.value)} /></label>
          <label>Grade<input type="number" min="1" value={preview.grade} onChange={(event) => update("grade", Number(event.target.value))} /></label>
          <label>Subject<input value={preview.subject} onChange={(event) => update("subject", event.target.value)} /></label>
          <label>Book (optional)<input value={preview.bookTitle ?? ""} onChange={(event) => update("bookTitle", event.target.value || null)} /></label>
          <label>Chapter number<input type="number" min="1" value={preview.chapterNumber ?? ""} onChange={(event) => update("chapterNumber", event.target.value ? Number(event.target.value) : null)} /></label>
          <label>Chapter title<input value={preview.chapterTitle} onChange={(event) => update("chapterTitle", event.target.value)} /></label>
          <p className="metadata-summary">{preview.questionCount} questions · {preview.sourceCount} cited pages</p>
          <button onClick={importBank} disabled={busy}>Confirm and import</button>
        </div>}
      </section>

      <section className="library-section">
        <h2>Imported chapters</h2>
        {library.length === 0 ? <p className="empty-state">Enter the passphrase and refresh to see the family library.</p> :
          <div className="library-grid">{library.map((item) => <article key={item.id}><span>{item.board} · Grade {item.grade} · {item.subject}</span><h3>{item.chapterNumber ? `${item.chapterNumber}. ` : ""}{item.chapterTitle}</h3><p>{item.questionCount} questions · bank v{item.bankVersion}</p></article>)}</div>}
      </section>
    </main>
  );
}
