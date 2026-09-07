"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type ReviewAttempt = { id: string; prompt: string; answer: string; correct: boolean; earnedMarks: number; originalEarnedMarks?: number; maxMarks: number; status: string; correctAnswer: string; explanation: string; sourcePages?: number[]; gradingPending?: boolean; retryAvailable?: boolean; scoreAppeal?: { status: string; resolved_earned_marks?: number | null } | null };
type SessionReview = { id: string; status: string; startedAt: string; totalQuestions: number; resumable?: boolean; attempts: ReviewAttempt[] };

export function ChildSessionReview({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionReview | null>(null);
  const [error, setError] = useState("");
  const [busyAttempt, setBusyAttempt] = useState("");
  const [appealOpen, setAppealOpen] = useState("");
  const [appealNote, setAppealNote] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/study/history/${encodeURIComponent(sessionId)}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    setSession(body);
  }, [sessionId]);

  useEffect(() => { void Promise.resolve().then(load).catch((cause) => setError(cause.message)); }, [load]);

  async function retryGrading(attemptId: string) {
    setBusyAttempt(attemptId); setError("");
    const response = await fetch("/api/study/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ retryAttemptId: attemptId }) });
    const body = await response.json();
    if (response.ok) await load(); else setError(body.error ?? "Could not retry automatic grading.");
    setBusyAttempt("");
  }

  async function appeal(attemptId: string) {
    setBusyAttempt(attemptId); setError("");
    const response = await fetch("/api/study/score-appeals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId, comment: appealNote }) });
    const body = await response.json();
    if (response.ok) { setAppealOpen(""); setAppealNote(""); await load(); }
    else setError(body.error ?? "Could not send this score appeal.");
    setBusyAttempt("");
  }

  return <main className="study-shell"><AppHeader role="child" /><section className="history-card">
    <Link href="/study/dashboard">← Back to dashboard</Link>
    {error && <p className="notice notice-error">{error}</p>}
    {!error && !session && <p className="study-loading">Loading session…</p>}
    {session && <>
      <p className="eyebrow">Session review</p><h1>{new Date(session.startedAt).toLocaleDateString()}</h1>
      <p>{session.status === "completed" ? "Completed" : "In progress"} · {session.attempts.length}/{session.totalQuestions} answered</p>
      {session.resumable && <Link className="button" href={`/study?resume=${encodeURIComponent(session.id)}`}>Resume session</Link>}
      <div className="history-attempts">{session.attempts.map((attempt, index) => <article className={attempt.gradingPending ? "attempt-partial" : attempt.correct ? "attempt-correct" : attempt.earnedMarks > 0 ? "attempt-partial" : "attempt-wrong"} key={attempt.id}>
        <header><span>Question {index + 1} · {attempt.gradingPending ? "not graded" : `${attempt.earnedMarks}/${attempt.maxMarks} marks`}</span><strong>{attempt.status}</strong></header>
        <h3>{attempt.prompt}</h3>
        <dl className="review-answers"><div><dt>Your answer</dt><dd>{attempt.answer || "No answer recorded"}</dd></div>{!attempt.gradingPending && <div><dt>Correct answer</dt><dd>{attempt.correctAnswer}</dd></div>}</dl>
        {attempt.explanation && <p className="review-explanation">{attempt.explanation}</p>}
        {attempt.gradingPending && attempt.retryAvailable && <button type="button" disabled={busyAttempt === attempt.id} onClick={() => retryGrading(attempt.id)}>{busyAttempt === attempt.id ? "Retrying…" : "Retry automatic grading"}</button>}
        {!attempt.gradingPending && !attempt.correct && !attempt.scoreAppeal && <div className="score-appeal"><button type="button" className="question-feedback-link" onClick={() => setAppealOpen(appealOpen === attempt.id ? "" : attempt.id)}>Appeal score</button>{appealOpen === attempt.id && <div className="question-feedback-panel"><label>Why should the score change? <span>(optional)</span><textarea rows={2} value={appealNote} onChange={(event) => setAppealNote(event.target.value)} /></label><div className="button-row"><button type="button" disabled={busyAttempt === attempt.id} onClick={() => appeal(attempt.id)}>Send to parent</button><button type="button" className="button-quiet" onClick={() => setAppealOpen("")}>Cancel</button></div></div>}</div>}
        {attempt.scoreAppeal && <p className="score-appeal-status">Score appeal: {attempt.scoreAppeal.status}{attempt.scoreAppeal.resolved_earned_marks !== null && attempt.scoreAppeal.resolved_earned_marks !== undefined ? ` · final score ${attempt.scoreAppeal.resolved_earned_marks}/${attempt.maxMarks}` : ""}</p>}
        {attempt.sourcePages?.length ? <small className="source-cite">Textbook {attempt.sourcePages.map((page) => `Page ${page}`).join(", ")}</small> : null}
      </article>)}</div>
    </>}
  </section></main>;
}
