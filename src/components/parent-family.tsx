"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { AppHeader } from "./app-header";
import { ConstellationStatus, MasteryConstellation } from "./progress-visual";
import { useRouter } from "next/navigation";

type Child = { id: string; displayName: string; board: string; grade: number; active: boolean };
type Workspace = { family: { name: string }; parent: { displayName: string }; children: Child[] };
type SubjectProgress = { subject: string; completedSessions: number; attempts: number; accuracy: number; mastery: number; readyToPractice: number; answersNeedingReview: number };
type ProgressSession = { id: string; subject: string; chapterTitle: string; status: string; startedAt: string; totalQuestions: number; attempts: { correct: boolean; earned_marks: number; max_marks: number; feedback?: { reviewRequired?: boolean } }[] };
type Progress = { child: Child; history: { summary: { completedSessions: number; attempts: number }; subjects: SubjectProgress[]; sessions: ProgressSession[] } };

function parentConstellation(session?: Progress["history"]["sessions"][number]): ConstellationStatus[] {
  if (!session) return [];
  const attempted = session.attempts.map((attempt) => attempt.feedback?.reviewRequired ? "review" : attempt.correct ? "correct" : attempt.earned_marks > 0 ? "partial" : "incorrect") satisfies ConstellationStatus[];
  return [...attempted, ...Array.from({ length: Math.max(0, session.totalQuestions - attempted.length) }, () => "pending" as const)];
}

export function ParentFamily() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [draft, setDraft] = useState({ displayName: "", board: "ICSE", grade: 6, pin: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [busy, setBusy] = useState(false);
  const headers = { "content-type": "application/json" };
  const load = useCallback(async () => {
    setBusy(true); setError(""); setMessage("");
    const [response, progressResponse] = await Promise.all([
      fetch("/api/parent/family"),
      fetch("/api/parent/progress"),
    ]);
    const body = await response.json();
    if (response.ok) {
      setWorkspace(body);
      if (progressResponse.ok) setProgress((await progressResponse.json()).children ?? []);
    } else if (response.status === 401) router.push("/login?role=parent");
    else setError(body.error ?? "Could not open the family workspace.");
    setBusy(false);
  }, [router]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function addChild(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/parent/children", { method: "POST", headers, body: JSON.stringify(draft) });
    const body = await response.json();
    if (response.ok) { setDraft({ displayName: "", board: "ICSE", grade: 6, pin: "" }); setMessage(`${body.child.displayName} is ready to study.`); await load(); }
    else setError(body.error ?? "Could not add this child.");
    setBusy(false);
  }

  async function deleteSession(childId: string, sessionId: string) {
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/parent/progress/session", { method: "DELETE", headers, body: JSON.stringify({ childId, sessionId }) });
    const body = await response.json();
    if (response.ok) { setConfirmDelete(""); await load(); setMessage("Session deleted. Progress has been recalculated."); }
    else setError(body.error ?? "Could not delete this session.");
    setBusy(false);
  }

  return <main className="parent-shell">
    <AppHeader role="parent" />
    <section className="parent-intro"><p className="eyebrow">Parent workspace</p><h1>Family profiles</h1><p>Add each child once. Their board and grade determine which family chapters appear when they study.</p></section>

    {!workspace ? <p className="study-loading">Opening the family workspace…</p> : <>
      <section className="family-summary"><div><span>Family</span><strong>{workspace.family.name}</strong></div><div><span>Owner-parent</span><strong>{workspace.parent.displayName}</strong></div><div><span>Children</span><strong>{workspace.children.length}</strong></div></section>
      <details className="import-card"><summary>Add a child</summary><div><h2 className="sr-only">Add a child</h2><form className="profile-form" onSubmit={addChild}><label>Name<input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label><label>Board<input value={draft.board} onChange={(event) => setDraft({ ...draft, board: event.target.value })} /></label><label>Grade<input type="number" min="1" max="12" value={draft.grade} onChange={(event) => setDraft({ ...draft, grade: Number(event.target.value) })} /></label><label>PIN (4–8 digits)<input type="password" inputMode="numeric" value={draft.pin} onChange={(event) => setDraft({ ...draft, pin: event.target.value })} /></label><button disabled={busy}>Add child</button></form>{error && <p className="notice notice-error" role="alert">{error}</p>}{message && <p className="notice">{message}</p>}</div></details>
      <section className="library-section"><h2>Children</h2>{workspace.children.length === 0 ? <p className="empty-state">No child profiles yet.</p> : <div className="child-admin-grid">{workspace.children.map((item) => <ChildEditor key={item.id} child={item} onSaved={load} />)}</div>}</section>
      {progress.length > 0 && <section className="library-section parent-learning-section"><div className="section-heading"><div><p className="eyebrow">Private progress for each child</p><h2>Learning activity</h2></div></div><div className="parent-progress-grid">{progress.map(({ child: item, history: { summary, subjects = [], sessions } }) => <article key={item.id} className="parent-progress-card"><header><div><span className="parent-brief-label">Learning brief</span><h3>{item.displayName}</h3><span>{item.board} · Grade {item.grade}</span></div><strong>{summary.completedSessions} {summary.completedSessions === 1 ? "session" : "sessions"}</strong></header><div className="parent-progress-overview"><div><p>{summary.completedSessions ? `${summary.attempts} questions answered across ${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}.` : "No study sessions completed yet."}</p><small>Progress stays private to this child.</small></div><MasteryConstellation label={sessions[0] ? `${item.displayName}'s latest session in ${sessions[0].subject}, ${sessions[0].chapterTitle}: ${sessions[0].attempts.length} of ${sessions[0].totalQuestions} questions answered` : `No recent session details for ${item.displayName}`} statuses={parentConstellation(sessions[0])} /></div>{subjects.length > 0 ? <div className="parent-subject-list">{subjects.map((subject) => { const subjectSessions = sessions.filter((session) => session.subject === subject.subject); return <details key={subject.subject} open={subjects.length === 1}><summary><strong>{subject.subject}</strong><span>{subject.completedSessions} {subject.completedSessions === 1 ? "session" : "sessions"}</span></summary><div className="parent-progress-stats"><span><strong>{subject.accuracy}%</strong> accuracy <MetricInfo label={`What ${subject.subject} accuracy means`} description={`Marks earned divided by marks possible in ${subject.subject}.`} /></span><span><strong>{subject.mastery}%</strong> mastery <MetricInfo label={`What ${subject.subject} mastery means`} description={`The latest score for every ${subject.subject} question this child has attempted.`} /></span>{subject.readyToPractice > 0 && <span><strong>{subject.readyToPractice}</strong> ready to practise again <MetricInfo label={`What ready to practise again means for ${subject.subject}`} description="Questions scheduled by spaced practice to appear again." /></span>}{subject.answersNeedingReview > 0 && <Link className="grading-review-count" href="/parent/family/session"><strong>{subject.answersNeedingReview}</strong> answers needing review</Link>}</div>{subjectSessions.length > 0 && <div className="parent-session-list">{subjectSessions.map((session) => { const earned = session.attempts.reduce((sum, attempt) => sum + attempt.earned_marks, 0); const total = session.attempts.reduce((sum, attempt) => sum + attempt.max_marks, 0); const confirming = confirmDelete === session.id; const needsReview = session.attempts.filter((attempt) => attempt.feedback?.reviewRequired).length; return <div key={session.id}><span>{session.subject} · {session.chapterTitle} · {new Date(session.startedAt).toLocaleDateString()}</span><strong>{earned}/{total || 0} marks</strong><small>{session.attempts.length} of {session.totalQuestions} answered · {session.status === "completed" ? "Completed" : "Not finished"}{needsReview ? ` · ${needsReview} ${needsReview === 1 ? "answer needs" : "answers need"} review` : ""}</small><div className="session-delete">{confirming ? <><span>This permanently removes the session and its answers.</span><button className="button-danger" disabled={busy} onClick={() => deleteSession(item.id, session.id)}>Delete permanently</button><button className="button-quiet" disabled={busy} onClick={() => setConfirmDelete("")}>Cancel</button></> : <button className="button-delete" onClick={() => setConfirmDelete(session.id)}>Delete session</button>}</div></div>; })}</div>}</details>; })}</div> : <p className="empty-state">No subject activity yet.</p>}</article>)}</div></section>}
    </>}
  </main>;
}

function MetricInfo({ label, description }: { label: string; description: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  return <span className="metric-help"><button type="button" className="metric-info" aria-label={label} aria-expanded={open} aria-describedby={open ? tooltipId : undefined} onClick={() => setOpen((value) => !value)} onBlur={() => setOpen(false)}>?</button>{open && <span className="metric-tooltip" id={tooltipId} role="tooltip">{description}</span>}</span>;
}

function ChildEditor({ child, onSaved }: { child: Child; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState({ ...child, pin: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus("");
    const response = await fetch("/api/parent/children", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
    const body = await response.json();
    if (response.ok) { setValue({ ...value, pin: "" }); setStatus("Saved."); await onSaved(); } else setStatus(body.error ?? "Could not save.");
    setBusy(false);
  }
  return <form className={`child-admin-card${value.active ? "" : " is-inactive"}`} onSubmit={save}><label>Name<input value={value.displayName} onChange={(event) => setValue({ ...value, displayName: event.target.value })} /></label><div className="profile-row"><label>Board<input value={value.board} onChange={(event) => setValue({ ...value, board: event.target.value })} /></label><label>Grade<input type="number" min="1" max="12" value={value.grade} onChange={(event) => setValue({ ...value, grade: Number(event.target.value) })} /></label></div><label>New PIN (leave blank to keep)<input type="password" inputMode="numeric" value={value.pin} onChange={(event) => setValue({ ...value, pin: event.target.value })} /></label><label className="active-toggle"><input type="checkbox" checked={value.active} onChange={(event) => setValue({ ...value, active: event.target.checked })} /> Active profile</label><div className="button-row"><button disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>{status && <span>{status}</span>}</div></form>;
}
