"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

export function ParentSessionReview() {
  const [children, setChildren] = useState<any[]>([]); const [error, setError] = useState("");
  useEffect(() => { fetch("/api/parent/progress").then(async (r) => { const body = await r.json(); if (!r.ok) throw new Error(body.error); return body.children ?? []; }).then(setChildren).catch((e) => setError(e.message)); }, []);
  return <main className="parent-shell"><AppHeader role="parent" /><section className="parent-intro"><Link href="/parent/family">← Back to children & progress</Link><p className="eyebrow">Parent review</p><h1>Session answers</h1><p>Inspect submitted answers and feedback for each child.</p></section>{error && <p className="notice notice-error">{error}</p>}{!error && !children.length && <p className="study-loading">Loading sessions…</p>}<section className="dashboard-section">{children.map(({ child, history }: any) => <article className="parent-progress-card" key={child.id}><h2>{child.displayName}</h2>{history.sessions.length === 0 ? <p className="empty-state">No sessions yet.</p> : history.sessions.map((session: any) => <div className="parent-review-session" key={session.id}><h3>{session.subject} · {session.chapterTitle}</h3><small>{new Date(session.startedAt).toLocaleDateString()} · {session.status === "completed" ? "Completed" : "Not finished"}</small>{session.attempts.map((attempt: any) => <div className={attempt.correct ? "attempt-correct" : "attempt-wrong"} key={attempt.id}><strong>{attempt.correct ? "Correct" : "Needs practice"} · {attempt.earned_marks}/{attempt.max_marks}</strong><p>{attempt.question_prompt}</p><small>{attempt.feedback?.explanation ?? "No feedback recorded."}</small></div>)}</div>)}</article>)}</section></main>;
}
