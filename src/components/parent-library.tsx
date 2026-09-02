"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { useRouter } from "next/navigation";

type Preview = {
  board: string; grade: number; subject: string; bookTitle: string | null;
  chapterNumber: number | null; chapterTitle: string; bankVersion: number; questionCount: number; sourceCount: number;
};
type LibraryItem = Preview & { id: string; bankVersion: number };
type ReportAttempt = { reportId: string; reporterName: string; note: string | null; response?: unknown; correct?: boolean; earnedMarks?: number; maxMarks?: number; feedback?: Record<string, unknown>; attemptedAt?: string };
type QuestionReport = {
  id: string; status: "open" | "dismissed" | "disabled" | "corrected"; bankVersion: number; questionId: string; questionVersion: number;
  questionSnapshot: Record<string, unknown>; chapter: { title: string; subject: string; grade?: number; board?: string };
  reporters: string[]; reportCount: number; attempts: ReportAttempt[]; sourcePages: number[]; createdAt: string;
  resolution: null | { resolvedAt: string; resolverName: string; note: string | null; replacementBankId: string | null; replacementSnapshot: Record<string, unknown> | null };
};

function answerSummary(question: Record<string, unknown>) {
  const answer = typeof question.answer === "object" && question.answer !== null ? question.answer as Record<string, unknown> : {};
  const response = typeof question.response === "object" && question.response !== null ? question.response as Record<string, unknown> : {};
  const options = Array.isArray(response.options) ? response.options as { id?: unknown; text?: unknown }[] : [];
  const optionText = (id: unknown) => String(options.find((option) => option.id === id)?.text ?? id ?? "");
  if (typeof answer.correctOptionId === "string") return optionText(answer.correctOptionId);
  if (Array.isArray(answer.correctOptionIds)) return answer.correctOptionIds.map(optionText).join(", ");
  if (Array.isArray(answer.accepted)) return answer.accepted.map(String).join(" / ");
  if (typeof answer.value === "boolean") return answer.value ? "True" : `False${answer.correction ? ` — ${String(answer.correction)}` : ""}`;
  return "";
}

export function ParentLibrary() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState<unknown>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [reports, setReports] = useState<{ open: QuestionReport[]; resolved: QuestionReport[] }>({ open: [], resolved: [] });
  const [busy, setBusy] = useState(false);

  const headers = { "content-type": "application/json" };

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

  const loadLibrary = useCallback(async () => {
    setErrors([]);
    const [response, reportResponse] = await Promise.all([
      fetch("/api/library"),
      fetch("/api/parent/question-reports"),
    ]);
    const result = await response.json();
    if (response.ok) {
      setLibrary(result.chapters);
      if (reportResponse.ok) {
        const reportResult = (await reportResponse.json()).reports;
        setReports(Array.isArray(reportResult) ? { open: reportResult, resolved: [] } : reportResult ?? { open: [], resolved: [] });
      }
    } else if (response.status === 401) router.push("/login?role=parent");
    else setErrors([result.error ?? "Could not load the library."]);
  }, [router]);
  useEffect(() => { void Promise.resolve().then(loadLibrary); }, [loadLibrary]);

  async function importBank() {
    if (!bank || !preview) return;
    setBusy(true); setErrors([]);
    const response = await fetch("/api/question-banks/import", { method: "POST", headers, body: JSON.stringify({ bank, metadata: preview }) });
    const result = await response.json();
    if (response.ok) {
      setMessage(result.versionAdjusted
        ? `Chapter imported as bank v${result.importedVersion}; the requested version was already in use.`
        : result.created
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
      <AppHeader role="parent" />

      <section className="parent-intro">
        <p className="eyebrow">Parent workspace</p>
        <h1>Content library</h1>
        <p>For the MVP, give textbook pages to Codex and ask it to prepare a StudyCraft question-bank JSON. Upload that JSON here. In a later version, the app will accept the pages and use your AI key itself.</p>
      </section>

      <section className="import-card">
        <h2>Import a prepared chapter</h2>
        <label>Question-bank JSON<input type="file" accept="application/json,.json" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setBank(null); }} /></label>
        <div className="button-row">
          <button onClick={validate} disabled={!file || busy}>{busy ? "Working…" : "Validate JSON"}</button>
          <button className="button-secondary" onClick={loadLibrary} disabled={busy}>Refresh library</button>
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
          <p className="metadata-summary">Bank v{preview.bankVersion} · {preview.questionCount} questions · {preview.sourceCount} cited pages</p>
          <button onClick={importBank} disabled={busy}>Confirm and import</button>
        </div>}
      </section>

      <section className="library-section">
        <div className="section-heading"><div><p className="eyebrow">Question quality</p><h2>Needs parent review</h2></div>{reports.open.length > 0 && <strong>{reports.open.length} flagged {reports.open.length === 1 ? "question" : "questions"}</strong>}</div>
        {reports.open.length === 0 ? <p className="empty-state">No questions currently need review.</p> : <div className="question-report-grid">{reports.open.map((report) => <QuestionReportEditor key={report.id} report={report} onSaved={loadLibrary} />)}</div>}
        {reports.resolved.length > 0 && <div className="resolved-reports"><h3>Recently resolved</h3>{reports.resolved.slice(0, 10).map((report) => <article key={`${report.id}-${report.status}`}><span className={`report-status is-${report.status}`}>{report.status}</span><div><strong>{String(report.questionSnapshot.prompt ?? report.questionId)}</strong><small>{report.chapter.subject} · {report.chapter.title} · resolved by {report.resolution?.resolverName ?? "Parent"}</small></div><time>{report.resolution?.resolvedAt ? new Date(report.resolution.resolvedAt).toLocaleDateString() : ""}</time></article>)}</div>}
      </section>

      <section className="library-section">
        <h2>Imported chapters</h2>
        {library.length === 0 ? <p className="empty-state">No chapters have been imported for this family yet.</p> :
          <div className="library-grid">{library.map((item) => <article key={item.id}><span>{item.board} · Grade {item.grade} · {item.subject}</span><h3>{item.chapterNumber ? `${item.chapterNumber}. ` : ""}{item.chapterTitle}</h3><p>{item.questionCount} questions · bank v{item.bankVersion}</p></article>)}</div>}
      </section>
    </main>
  );
}

function QuestionReportEditor({ report, onSaved }: { report: QuestionReport; onSaved: () => Promise<void> }) {
  const original = report.questionSnapshot;
  const expectedAnswer = answerSummary(original);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = async (action: "disable" | "dismiss") => {
    setBusy(true); setError("");
    const response = await fetch("/api/parent/question-reports", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ reportId: report.id, action, note }) });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Could not update this report."); else await onSaved();
    setBusy(false);
  };
  return <article className="question-report-card"><header><div><span>{report.chapter.board} · Grade {report.chapter.grade} · {report.chapter.subject}</span><h3>{report.chapter.title}</h3></div><small>Bank v{report.bankVersion} · Question v{report.questionVersion}</small></header><div className="report-summary"><span>Flagged by <strong>{report.reporters.join(", ")}</strong></span>{report.reportCount > 1 && <span>{report.reportCount} reports grouped</span>}<time>{new Date(report.createdAt).toLocaleDateString()}</time></div><blockquote>{String(original.prompt ?? report.questionId)}</blockquote>
    <div className="report-attempts">{report.attempts.map((attempt) => { const feedback = attempt.feedback ?? {}; const markedCorrect = attempt.correct === true || (Number(attempt.maxMarks) > 0 && Number(attempt.earnedMarks) >= Number(attempt.maxMarks)); return <article key={attempt.reportId}><header><strong>{attempt.reporterName}</strong>{typeof attempt.correct === "boolean" ? <span className={markedCorrect ? "is-correct" : "is-wrong"}>{markedCorrect ? "Marked correct" : "Marked incorrect"} · {attempt.earnedMarks}/{attempt.maxMarks}</span> : <span>Reported before answering</span>}</header>{attempt.response !== undefined && <p><b>Child answered:</b> {typeof attempt.response === "string" ? attempt.response : JSON.stringify(attempt.response)}</p>}{feedback.expectedAnswer !== undefined && <p><b>Expected:</b> {String(feedback.expectedAnswer)}</p>}{feedback.explanation !== undefined && <p>{String(feedback.explanation)}</p>}{attempt.note && <p><b>Child comment:</b> {attempt.note}</p>}</article>; })}</div>
    {expectedAnswer && <p className="report-explanation"><b>Expected answer:</b> {expectedAnswer}</p>}{String(original.explanation ?? "") && <p className="report-explanation"><b>Question explanation:</b> {String(original.explanation)}</p>}{report.sourcePages.length > 0 && <p className="source-cite">Textbook {report.sourcePages.map((page) => `Page ${page}`).join(", ")}</p>}
    <label className="resolution-note">Parent note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why are you disabling or dismissing this?" /></label>
    {error && <p className="notice notice-error">{error}</p>}<div className="button-row report-actions"><button disabled={busy} onClick={() => request("disable")}>Disable question</button><button disabled={busy} className="button-quiet" onClick={() => request("dismiss")}>Dismiss as valid</button></div></article>;
}
