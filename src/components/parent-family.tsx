"use client";

import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { AppHeader } from "./app-header";
import { ConstellationStatus, MasteryConstellation } from "./progress-visual";
import { useRouter } from "next/navigation";

type Child = { id: string; displayName: string; board: string; grade: number; active: boolean };
type Workspace = { family: { name: string }; parent: { displayName: string }; children: Child[] };
type Progress = { child: Child; history: { summary: { completedSessions: number; attempts: number; accuracy: number; mastery: number; dueReview: number; gradingReview?: number }; sessions: { id: string; status: string; startedAt: string; totalQuestions: number; attempts: { correct: boolean; earned_marks: number; max_marks: number; feedback?: { reviewRequired?: boolean } }[] }[] } };

function parentConstellation(session?: Progress["history"]["sessions"][number]): ConstellationStatus[] {
  if (!session) return [];
  const attempted = session.attempts.map((attempt) => attempt.feedback?.reviewRequired ? "review" : attempt.correct ? "correct" : attempt.earned_marks > 0 ? "partial" : "incorrect") satisfies ConstellationStatus[];
  return [...attempted, ...Array.from({ length: Math.max(0, session.totalQuestions - attempted.length) }, () => "pending" as const)];
}

function learningBrief(summary: Progress["history"]["summary"]) {
  if (summary.completedSessions === 0) return "No study sessions completed yet.";
  if (summary.gradingReview) return `${summary.gradingReview} ${summary.gradingReview === 1 ? "answer needs" : "answers need"} a quick parent look.`;
  if (summary.dueReview > 0) return `${summary.dueReview} ${summary.dueReview === 1 ? "idea is" : "ideas are"} ready to be strengthened.`;
  return "Practice is on track. No review is due today.";
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
      {progress.length > 0 && <section className="library-section parent-learning-section"><div className="section-heading"><div><p className="eyebrow">Private progress for each child</p><h2>Learning activity</h2></div></div><div className="parent-progress-grid">{progress.map(({ child: item, history: { summary, sessions } }) => <article key={item.id} className="parent-progress-card"><header><div><span className="parent-brief-label">Learning brief</span><h3>{item.displayName}</h3><span>{item.board} · Grade {item.grade}</span></div><strong>{summary.accuracy}% accuracy <MetricInfo label="What accuracy means" description="Marks earned divided by marks possible across all attempts." /></strong></header><div className="parent-progress-overview"><div><p>{learningBrief(summary)}</p><small>{summary.completedSessions === 0 ? "Progress will stay private to this child." : `${summary.completedSessions} ${summary.completedSessions === 1 ? "session" : "sessions"} completed so far.`}</small></div><MasteryConstellation label={sessions[0] ? `${item.displayName}'s latest session: ${sessions[0].attempts.length} of ${sessions[0].totalQuestions} questions answered` : `No recent session details for ${item.displayName}`} statuses={parentConstellation(sessions[0])} /></div><div className="parent-progress-stats"><span><strong>{summary.completedSessions}</strong> sessions</span><span><strong>{summary.mastery}%</strong> mastery <MetricInfo label="What mastery means" description="The latest score for every question this child has attempted." /></span><span><strong>{summary.dueReview}</strong> due <MetricInfo label="What due for review means" description="Questions scheduled for another practice attempt today." /></span>{Boolean(summary.gradingReview) && <span className="grading-review-count"><strong>{summary.gradingReview}</strong> grading review</span>}</div>{sessions.length > 0 ? <div className="parent-session-list">{sessions.map((session) => { const earned = session.attempts.reduce((sum, attempt) => sum + attempt.earned_marks, 0); const total = session.attempts.reduce((sum, attempt) => sum + attempt.max_marks, 0); const confirming = confirmDelete === session.id; const needsReview = session.attempts.filter((attempt) => attempt.feedback?.reviewRequired).length; return <div key={session.id}><span>{new Date(session.startedAt).toLocaleDateString()}</span><strong>{earned}/{total || 0} marks</strong><small>{session.attempts.length} of {session.totalQuestions} answered · {session.status === "completed" ? "Completed" : "Not finished"}{needsReview ? ` · ${needsReview} needs grading review` : ""}</small><div className="session-delete">{confirming ? <><span>This permanently removes the session and its answers.</span><button className="button-danger" disabled={busy} onClick={() => deleteSession(item.id, session.id)}>Delete permanently</button><button className="button-quiet" disabled={busy} onClick={() => setConfirmDelete("")}>Cancel</button></> : <button className="button-delete" onClick={() => setConfirmDelete(session.id)}>Delete session</button>}</div></div>; })}</div> : <p className="empty-state">No study sessions yet.</p>}</article>)}</div></section>}
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
