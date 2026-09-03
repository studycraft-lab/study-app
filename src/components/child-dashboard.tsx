"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { ConstellationStatus, MasteryConstellation } from "./mastery-constellation";

type Attempt = { id: string; question_prompt: string; correct: boolean; earned_marks: number; max_marks: number };
type Session = { id: string; status: string; resumable?: boolean; startedAt: string; totalQuestions: number; attempts: Attempt[] };
type History = { summary: { completedSessions: number; rewards?: { stars: number } }; sessions: Session[] };
type StudyLibrary = { child?: { displayName: string }; chapters?: { id: string; chapterTitle: string }[] };

function sessionStatuses(session?: Session): ConstellationStatus[] {
  if (!session) return [];
  const attempted = session.attempts.map((attempt) => attempt.correct ? "correct" : attempt.earned_marks > 0 ? "partial" : "incorrect") satisfies ConstellationStatus[];
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
  const heroCopy = resumableSession
    ? `You are ${resumableSession.attempts.length} ${resumableSession.attempts.length === 1 ? "question" : "questions"} in. Your place—and your progress—are saved.`
    : latestSession
      ? `Your latest constellation has ${latestSession.attempts.length} of ${latestSession.totalQuestions} stars revealed.`
      : "Every answer adds a new point of light. Choose a chapter when you are ready.";

  return <main className="study-shell">
    <AppHeader role="child" childName={library?.child?.displayName} />
    <section className="dashboard-hero dashboard-sky">
      <div className="dashboard-hero-copy"><p className="eyebrow">Your study space</p><h1>{firstName ? `Welcome back, ${firstName}.` : "Welcome back."}</h1><p>{heroCopy}</p><Link className="button" aria-label={resumableSession ? "Continue latest constellation" : "Choose a chapter"} href={resumableSession ? `/study?resume=${encodeURIComponent(resumableSession.id)}` : "/study"}>{resumableSession ? "Resume constellation" : "Choose a chapter"}<span aria-hidden="true">→</span></Link></div>
      <div className="dashboard-constellation"><span className="constellation-kicker">{latestSession ? "Your latest sky" : "Your first sky awaits"}</span><MasteryConstellation label={latestSession ? `${latestSession.attempts.length} of ${latestSession.totalQuestions} questions revealed in the latest session` : "An empty ten-star study constellation"} statuses={sessionStatuses(latestSession)} /></div>
    </section>
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
