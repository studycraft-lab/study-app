"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { ProgressVisual, ProgressVisualStatus } from "./progress-visual";

type Attempt = { id: string; question_prompt: string; correct: boolean; earned_marks: number; max_marks: number };
type Session = { id: string; status: string; resumable?: boolean; startedAt: string; totalQuestions: number; attempts: Attempt[] };
type History = { summary: { completedSessions: number; attempts?: number }; sessions: Session[] };
type StudyLibrary = { child?: { displayName: string }; chapters?: { id: string; chapterTitle: string }[] };

function sessionStatuses(session?: Session): ProgressVisualStatus[] {
  if (!session) return [];
  const attempted = session.attempts.map((attempt) => attempt.correct ? "correct" : attempt.earned_marks > 0 ? "partial" : "incorrect") satisfies ProgressVisualStatus[];
  return [...attempted, ...Array.from({ length: Math.max(0, session.totalQuestions - attempted.length) }, () => "pending" as const)];
}

export function ChildDashboard() {
  const [history, setHistory] = useState<History | null>(null);
  const [library, setLibrary] = useState<StudyLibrary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([fetch("/api/study/history"), fetch("/api/study/library")])
      .then(async ([historyResponse, libraryResponse]) => {
        if (!historyResponse.ok) throw new Error((await historyResponse.json()).error);
        const [historyBody, libraryBody] = await Promise.all([
          historyResponse.json(),
          libraryResponse.ok ? libraryResponse.json() : Promise.resolve(null),
        ]);
        setHistory(historyBody);
        if (libraryBody) setLibrary(libraryBody);
      })
      .catch((cause) => setError(cause.message));
  }, []);

  const latestSession = history?.sessions[0];
  const resumableSession = history?.sessions.find((session) => session.resumable);
  const firstName = library?.child?.displayName?.trim().split(/\s+/)[0];
  const answeredQuestions = history?.summary.attempts ?? history?.sessions.reduce((sum, session) => sum + session.attempts.length, 0) ?? 0;
  const heroCopy = resumableSession
    ? `You have answered ${resumableSession.attempts.length} of ${resumableSession.totalQuestions} questions. Pick up where you left off.`
    : latestSession
      ? `Your latest session: ${latestSession.attempts.length} of ${latestSession.totalQuestions} questions answered.`
      : "Choose a chapter to begin a practice session.";

  return <main className="study-shell">
    <AppHeader role="child" childName={library?.child?.displayName} />
    <section className="dashboard-hero dashboard-progress-hero">
      <div className="dashboard-hero-copy"><p className="eyebrow">Your progress</p><h1>{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h1><p>{heroCopy}</p><Link className="button" href={resumableSession ? `/study?resume=${encodeURIComponent(resumableSession.id)}` : "/study"}>{resumableSession ? "Resume session" : "Study now"}<span aria-hidden="true">→</span></Link></div>
      <div className="dashboard-progress-visual"><span className="progress-visual-kicker">{latestSession ? "Latest session" : "No sessions yet"}</span><ProgressVisual label={latestSession ? `Latest session: ${latestSession.attempts.length} of ${latestSession.totalQuestions} questions answered` : "No practice sessions completed yet"} statuses={sessionStatuses(latestSession)} /></div>
    </section>
    {error ? <p className="notice notice-error">{error}</p> : !history ? <p className="study-loading">Loading your progress…</p> : <>
      <section className="child-motivation" aria-label="Your activity"><div><strong>{answeredQuestions}</strong><span>questions answered</span></div><div><strong>{history.summary.completedSessions}</strong><span>sessions completed</span></div></section>
      <section className="dashboard-section"><div className="section-heading"><h2>Recent scores</h2></div>{history.sessions.length === 0 ? <div className="empty-state"><p>No scores yet.</p><Link href="/study">Start your first chapter</Link></div> : <div className="dashboard-sessions">{history.sessions.map((session) => {
        const earned = session.attempts.reduce((sum, attempt) => sum + attempt.earned_marks, 0);
        const total = session.attempts.reduce((sum, attempt) => sum + attempt.max_marks, 0);
        const completed = session.status === "completed";
        const canResume = !completed && session.resumable;
        return <Link className="dashboard-session" href={canResume ? `/study?resume=${encodeURIComponent(session.id)}` : `/study/history/${session.id}`} key={session.id}><span>{new Date(session.startedAt).toLocaleDateString()}</span><strong>{earned}/{total || 0} marks</strong><small>{session.attempts.length}/{session.totalQuestions} answered · {completed ? "Completed" : canResume ? "Resume session" : "Not finished"}</small><b>›</b></Link>;
      })}</div>}</section>
      <p className="dashboard-note">Your answers and progress are private to you.</p>
    </>}
  </main>;
}
