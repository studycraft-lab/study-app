"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type Attempt = { id: string; question_prompt: string; correct: boolean; earned_marks: number; max_marks: number; feedback?: { explanation?: string; reviewRequired?: boolean } };
type Session = { id: string; status: string; startedAt: string; totalQuestions: number; attempts: Attempt[] };
type History = { summary: { completedSessions: number; attempts: number; accuracy: number; mastery: number; dueReview: number; rewards?: { points: number; stars: number; level: number; streak: number } }; sessions: Session[] };

export function ChildDashboard() {
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/study/history").then(async (r) => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); }).then(setHistory).catch((e) => setError(e.message)); }, []);
  const summary = history?.summary;
  const rewards = summary?.rewards ?? { points: 0, stars: 0, level: 1, streak: 0 };
  return <main className="study-shell"><AppHeader role="child" /><section className="dashboard-hero"><p className="eyebrow">Your learning space</p><h1>Keep building your knowledge.</h1><p>Pick up where you left off, or start a fresh chapter.</p><Link className="button" href="/study">Start studying</Link></section>{error ? <p className="notice notice-error">{error}</p> : !history ? <p className="study-loading">Loading your progress…</p> : <>
    <section className="dashboard-stats"><div><strong>{summary?.accuracy ?? 0}%</strong><span>Accuracy</span></div><div><strong>{summary?.mastery ?? 0}%</strong><span>Mastery</span></div><div><strong>{summary?.dueReview ?? 0}</strong><span>Review due</span></div><div><strong>{rewards.points}</strong><span>Points · Level {rewards.level}</span></div><div><strong>{rewards.streak}</strong><span>Day streak</span></div></section>
    <section className="dashboard-section"><div className="section-heading"><h2>Recent sessions</h2><span>{summary?.completedSessions ?? 0} completed</span></div>{history.sessions.length === 0 ? <div className="empty-state"><p>No sessions yet.</p><Link href="/study">Start your first chapter</Link></div> : <div className="dashboard-sessions">{history.sessions.map((session) => { const earned = session.attempts.reduce((s, a) => s + a.earned_marks, 0); const total = session.attempts.reduce((s, a) => s + a.max_marks, 0); return <Link className="dashboard-session" href={`/study/history/${session.id}`} key={session.id}><span>{new Date(session.startedAt).toLocaleDateString()}</span><strong>{earned}/{total || 0} marks</strong><small>{session.attempts.length}/{session.totalQuestions} answered · {session.status === "completed" ? "Completed" : "Continue"}</small><b>›</b></Link>; })}</div>}</section>
    <p className="dashboard-note">Stars and points are private to you. They reward correct answers, effort, and consistency.</p>
  </>}</main>;
}
