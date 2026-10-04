"use client";

import { useState } from "react";

type Appeal = { question_id: string; answer: string; status: string; resolved_status: string | null; parent_comment: string | null };

export function GrammarAppeal({ slug, questionId, answer, appeal }: { slug: string; questionId: string; answer: string; appeal?: Appeal }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const current = appeal?.answer === answer ? appeal : undefined;
  if (!answer.trim()) return null;
  if (submitted || current?.status === "pending") return <p className="score-appeal-status">Appeal sent to your parent for review.</p>;
  if (current?.resolved_status) return <p className="score-appeal-status">Parent review: {current.resolved_status}.{current.parent_comment ? ` ${current.parent_comment}` : ""}</p>;
  async function send() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/study/grammar/appeals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, questionId, comment: note }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not send this appeal.");
      setSubmitted(true); setOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send this appeal."); }
    finally { setBusy(false); }
  }
  return <div className="score-appeal"><button type="button" className="question-feedback-link" onClick={() => setOpen(!open)}>Appeal this answer</button>
    {open && <div className="question-feedback-panel"><p>Ask your parent to review this answer and its score.</p><label>Why should it be accepted? <span>(optional)</span><textarea rows={2} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label><div className="button-row"><button type="button" disabled={busy} onClick={() => void send()}>{busy ? "Sending…" : "Send to parent"}</button><button type="button" className="button-quiet" onClick={() => setOpen(false)}>Cancel</button></div></div>}
    {error && <p className="notice notice-error" role="alert">{error}</p>}
  </div>;
}
