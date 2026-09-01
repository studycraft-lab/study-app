"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type Attempt = { id: string; question_prompt: string; correct: boolean; earned_marks: number; max_marks: number };
type Session = { id: string; status: string; resumable?: boolean; startedAt: string; totalQuestions: number; attempts: Attempt[] };
type History = { summary: { completedSessions: number; rewards?: { stars: number } }; sessions: Session[] };

export function ChildDashboard() {
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/study/history").then(async (response) => { if (!response.ok) throw new Error((await response.json()).error); return response.json(); }).then(setHistory).catch((cause) => setError(cause.message)); }, []);

  return <main className="study-shell">
    <AppHeader role="child" />
    <section className="dashboard-hero"><p className="eyebrow">Your progress</p><h1>Keep it going.</h1><p>See your latest scores and continue when you are ready.</p><Link className="button" href="/study">Study now</Link></section>
    {error ? <p className="notice notice-error">{error}</p> : !history ? <p className="study-loading">Loading your progress…</p> : <>
      <section className="child-motivation" aria-label="Your achievements"><div><strong>{history.summary.rewards?.stars ?? 0}</strong><span>Stars</span></div><div><strong>{history.summary.completedSessions}</strong><span>sessions completed</span></div></section>
      <section className="dashboard-section"><div className="section-heading"><h2>Recent scores</h2></div>{history.sessions.length === 0 ? <div className="empty-state"><p>No scores yet.</p><Link href="/study">Start your first chapter</Link></div> : <div className="dashboard-sessions">{history.sessions.map((session) => {
        const earned = session.attempts.reduce((sum, attempt) => sum + attempt.earned_marks, 0);
        const total = session.attempts.reduce((sum, attempt) => sum + attempt.max_marks, 0);
        const completed = session.status === "completed";
        const canResume = !completed && session.resumable;
        return <Link className="dashboard-session" href={canResume ? `/study?resume=${encodeURIComponent(session.id)}` : `/study/history/${session.id}`} key={session.id}><span>{new Date(session.startedAt).toLocaleDateString()}</span><strong>{earned}/{total || 0} marks</strong><small>{session.attempts.length}/{session.totalQuestions} answered · {completed ? "Completed" : canResume ? "Resume session" : "Not finished"}</small><b>›</b></Link>;
      })}</div>}</section>
      <p className="dashboard-note">Stars reward correct answers and steady practice. They are private to you.</p>
    </>}
  </main>;
}
