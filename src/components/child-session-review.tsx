"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type ReviewAttempt = { id: string; prompt: string; answer: string; correct: boolean; earnedMarks: number; maxMarks: number; status: string; correctAnswer: string; explanation: string; sourcePages?: number[] };
type SessionReview = { id: string; status: string; startedAt: string; totalQuestions: number; resumable?: boolean; attempts: ReviewAttempt[] };

export function ChildSessionReview({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionReview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/study/history/${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; })
      .then(setSession)
      .catch((cause) => setError(cause.message));
  }, [sessionId]);

  return <main className="study-shell"><AppHeader role="child" /><section className="history-card">
    <Link href="/study/dashboard">← Back to dashboard</Link>
    {error && <p className="notice notice-error">{error}</p>}
    {!error && !session && <p className="study-loading">Loading session…</p>}
    {session && <>
      <p className="eyebrow">Session review</p><h1>{new Date(session.startedAt).toLocaleDateString()}</h1>
      <p>{session.status === "completed" ? "Completed" : "In progress"} · {session.attempts.length}/{session.totalQuestions} answered</p>
      {session.resumable && <Link className="button" href={`/study?resume=${encodeURIComponent(session.id)}`}>Resume session</Link>}
      <div className="history-attempts">{session.attempts.map((attempt, index) => <article className={attempt.correct ? "attempt-correct" : attempt.earnedMarks > 0 ? "attempt-partial" : "attempt-wrong"} key={attempt.id}>
        <header><span>Question {index + 1} · {attempt.earnedMarks}/{attempt.maxMarks} marks</span><strong>{attempt.status}</strong></header>
        <h3>{attempt.prompt}</h3>
        <dl className="review-answers"><div><dt>Your answer</dt><dd>{attempt.answer || "No answer recorded"}</dd></div><div><dt>Correct answer</dt><dd>{attempt.correctAnswer}</dd></div></dl>
        {attempt.explanation && <p className="review-explanation">{attempt.explanation}</p>}
        {attempt.sourcePages?.length ? <small className="source-cite">Textbook {attempt.sourcePages.map((page) => `Page ${page}`).join(", ")}</small> : null}
      </article>)}</div>
    </>}
  </section></main>;
}
