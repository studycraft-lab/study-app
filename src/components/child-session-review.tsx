"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

export function ChildSessionReview({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<any>(null); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/study/history").then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error); return body; }).then((body) => setSession(body.sessions.find((item: any) => item.id === sessionId) ?? null)).catch((e) => setError(e.message)); }, [sessionId]);
  return <main className="study-shell"><AppHeader role="child" /><section className="history-card"><Link href="/study/dashboard">← Back to dashboard</Link>{error && <p className="notice notice-error">{error}</p>}{!error && !session && <p className="study-loading">Loading session…</p>}{session && <><p className="eyebrow">Session review</p><h1>{new Date(session.startedAt).toLocaleDateString()}</h1><p>{session.status === "completed" ? "Completed" : "In progress"} · {session.attempts.length}/{session.totalQuestions} answered</p><div className="history-attempts">{session.attempts.map((attempt: any, index: number) => <article className={attempt.correct ? "attempt-correct" : "attempt-wrong"} key={attempt.id}><span>Question {index + 1} · {attempt.earned_marks}/{attempt.max_marks} marks</span><h3>{attempt.question_prompt}</h3><p>{attempt.feedback?.explanation ?? (attempt.correct ? "Correct." : "Needs more practice.")}</p></article>)}</div></>}</section></main>;
}
