"use client";

import { useState } from "react";
import Link from "next/link";

type Preview = {
  board: string; grade: number; subject: string; bookTitle: string | null;
  chapterNumber: number | null; chapterTitle: string; questionCount: number; sourceCount: number;
};
type LibraryItem = Preview & { id: string; bankVersion: number };
type ReportAttempt = { reportId: string; reporterName: string; note: string | null; response: unknown; correct: boolean; earnedMarks: number; maxMarks: number; feedback: Record<string, unknown>; attemptedAt: string };
type QuestionReport = {
  id: string; status: "open" | "dismissed" | "disabled" | "corrected"; bankVersion: number; questionId: string; questionVersion: number;
  questionSnapshot: Record<string, unknown>; chapter: { title: string; subject: string; grade?: number; board?: string };
  reporters: string[]; reportCount: number; attempts: ReportAttempt[]; createdAt: string;
  resolution: null | { resolvedAt: string; resolverName: string; note: string | null; replacementBankId: string | null; replacementSnapshot: Record<string, unknown> | null };
};

export function ParentLibrary() {
  const [passphrase, setPassphrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState<unknown>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [reports, setReports] = useState<{ open: QuestionReport[]; resolved: QuestionReport[] }>({ open: [], resolved: [] });
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
    setErrors([]);
    const authHeaders = { "x-studycraft-parent-passphrase": passphrase };
    const [response, reportResponse] = await Promise.all([
      fetch("/api/library", { headers: authHeaders }),
      fetch("/api/parent/question-reports", { headers: authHeaders }),
    ]);
    const result = await response.json();
    if (response.ok) {
      setLibrary(result.chapters);
      if (reportResponse.ok) {
        const reportResult = (await reportResponse.json()).reports;
        setReports(Array.isArray(reportResult) ? { open: reportResult, resolved: [] } : reportResult ?? { open: [], resolved: [] });
      }
    } else setErrors([result.error ?? "Could not load the library."]);
  }

  async function importBank() {
    if (!bank || !preview) return;
    setBusy(true); setErrors([]);
    const response = await fetch("/api/question-banks/import", { method: "POST", headers, body: JSON.stringify({ bank, metadata: preview }) });
    const result = await response.json();
    if (response.ok) {
      setMessage(result.created
        ? "Chapter imported."
        : result.replaced
          ? "Chapter bank replaced with the latest content."
          : "This bank was already imported; nothing was duplicated.");
      await loadLibrary();
    }
    else setErrors(result.errors ?? [result.error ?? "Import failed."]);
    setBusy(false);
  }

  return (
    <main className="parent-shell">
      <header className="parent-header">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link>
        <nav className="parent-links"><Link href="/parent/family">Manage children</Link><Link href="/study">Child study</Link></nav>
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
        <div className="section-heading"><div><p className="eyebrow">Question quality</p><h2>Needs parent review</h2></div>{reports.open.length > 0 && <strong>{reports.open.length} flagged {reports.open.length === 1 ? "question" : "questions"}</strong>}</div>
        {reports.open.length === 0 ? <p className="empty-state">Refresh the library to see questions children have flagged.</p> : <div className="question-report-grid">{reports.open.map((report) => <QuestionReportEditor key={report.id} report={report} passphrase={passphrase} onSaved={loadLibrary} />)}</div>}
        {reports.resolved.length > 0 && <div className="resolved-reports"><h3>Recently resolved</h3>{reports.resolved.slice(0, 10).map((report) => <article key={`${report.id}-${report.status}`}><span className={`report-status is-${report.status}`}>{report.status}</span><div><strong>{String(report.questionSnapshot.prompt ?? report.questionId)}</strong><small>{report.chapter.subject} · {report.chapter.title} · resolved by {report.resolution?.resolverName ?? "Parent"}</small></div><time>{report.resolution?.resolvedAt ? new Date(report.resolution.resolvedAt).toLocaleDateString() : ""}</time></article>)}</div>}
      </section>

      <section className="library-section">
        <h2>Imported chapters</h2>
        {library.length === 0 ? <p className="empty-state">Enter the passphrase and refresh to see the family library.</p> :
          <div className="library-grid">{library.map((item) => <article key={item.id}><span>{item.board} · Grade {item.grade} · {item.subject}</span><h3>{item.chapterNumber ? `${item.chapterNumber}. ` : ""}{item.chapterTitle}</h3><p>{item.questionCount} questions · bank v{item.bankVersion}</p></article>)}</div>}
      </section>
    </main>
  );
}

function QuestionReportEditor({ report, passphrase, onSaved }: { report: QuestionReport; passphrase: string; onSaved: () => Promise<void> }) {
  const original = report.questionSnapshot;
  const [prompt, setPrompt] = useState(String(original.prompt ?? ""));
  const [explanation, setExplanation] = useState(String(original.explanation ?? ""));
  const [answerJson, setAnswerJson] = useState(JSON.stringify(original.answer ?? {}, null, 2));
  const [responseJson, setResponseJson] = useState(JSON.stringify(original.response ?? {}, null, 2));
  const [rubricJson, setRubricJson] = useState(JSON.stringify(original.rubric ?? {}, null, 2));
  const [sourceRefsJson, setSourceRefsJson] = useState(JSON.stringify(original.sourceRefs ?? [], null, 2));
  const [questionJson, setQuestionJson] = useState(JSON.stringify(original, null, 2));
  const [advanced, setAdvanced] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = async (action: "correct" | "disable" | "dismiss") => {
    setBusy(true); setError("");
    try {
      const question = action === "correct" ? advanced ? JSON.parse(questionJson) : {
        ...original, prompt, explanation, answer: JSON.parse(answerJson), response: JSON.parse(responseJson),
        rubric: JSON.parse(rubricJson), sourceRefs: JSON.parse(sourceRefsJson),
      } : undefined;
      const response = await fetch("/api/parent/question-reports", { method: "PATCH", headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": passphrase }, body: JSON.stringify({ reportId: report.id, action, question, note }) });
      const body = await response.json();
      if (!response.ok) setError(body.error ?? "Could not update this report."); else await onSaved();
    } catch { setError("One of the corrected fields contains invalid JSON."); }
    setBusy(false);
  };
  return <article className="question-report-card"><header><div><span>{report.chapter.board} · Grade {report.chapter.grade} · {report.chapter.subject}</span><h3>{report.chapter.title}</h3></div><small>Bank v{report.bankVersion} · Question v{report.questionVersion}</small></header><div className="report-summary"><span>Flagged by <strong>{report.reporters.join(", ")}</strong></span>{report.reportCount > 1 && <span>{report.reportCount} reports grouped</span>}<time>{new Date(report.createdAt).toLocaleDateString()}</time></div><blockquote>{String(original.prompt ?? report.questionId)}</blockquote>
    <div className="report-attempts">{report.attempts.map((attempt) => { const feedback = attempt.feedback ?? {}; const pages = Array.isArray(feedback.sourcePages) ? feedback.sourcePages : []; return <article key={attempt.reportId}><header><strong>{attempt.reporterName}</strong><span className={attempt.correct ? "is-correct" : "is-wrong"}>{attempt.correct ? "Marked correct" : "Marked incorrect"} · {attempt.earnedMarks}/{attempt.maxMarks}</span></header><p><b>Child answered:</b> {typeof attempt.response === "string" ? attempt.response : JSON.stringify(attempt.response)}</p><p><b>Expected:</b> {String(feedback.expectedAnswer ?? "Not recorded")}</p><p>{String(feedback.explanation ?? "")}</p>{pages.length > 0 && <small>Textbook {pages.map((page) => `page ${page}`).join(", ")}</small>}{attempt.note && <p><b>Child note:</b> {attempt.note}</p>}</article>; })}</div>
    <div className="structured-question-editor"><h4>Correct the question</h4><label>Question prompt<textarea rows={3} value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label><label>Explanation<textarea rows={3} value={explanation} onChange={(event) => setExplanation(event.target.value)} /></label><div className="structured-json-grid"><label>Answer JSON<textarea rows={7} value={answerJson} onChange={(event) => setAnswerJson(event.target.value)} /></label><label>Choices / response JSON<textarea rows={7} value={responseJson} onChange={(event) => setResponseJson(event.target.value)} /></label><label>Scoring rubric JSON<textarea rows={7} value={rubricJson} onChange={(event) => setRubricJson(event.target.value)} /></label><label>Source citations JSON<textarea rows={7} value={sourceRefsJson} onChange={(event) => setSourceRefsJson(event.target.value)} /></label></div><label className="active-toggle"><input type="checkbox" checked={advanced} onChange={(event) => setAdvanced(event.target.checked)} /> Advanced: edit the complete question JSON</label>{advanced && <label>Complete question JSON<textarea rows={14} value={questionJson} onChange={(event) => setQuestionJson(event.target.value)} /></label>}<label>Resolution note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="What was wrong or why was this dismissed?" /></label></div>
    {error && <p className="notice notice-error">{error}</p>}<div className="button-row report-actions"><button disabled={busy} onClick={() => request("correct")}>Validate and publish correction</button><button disabled={busy} className="button-secondary" onClick={() => request("disable")}>Disable question</button><button disabled={busy} className="button-quiet" onClick={() => request("dismiss")}>Dismiss as valid</button></div></article>;
}
