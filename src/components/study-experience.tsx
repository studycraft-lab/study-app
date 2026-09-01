"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Chapter = { id: string; board: string; grade: number; subject: string; chapterNumber?: number | null; chapterTitle: string; questionCount: number };
type Child = { id: string; displayName: string; board: string; grade: number };
type Option = { id: string; text: string };
type Question = { id: string; type: string; prompt: string; marks: number; response: { options?: Option[]; left?: Option[]; right?: Option[]; requiresCorrectionWhenFalse?: boolean } };
type Feedback = { correct: boolean; expectedAnswer: string; explanation: string; sourcePages: number[] };
type Status = "pending" | "correct" | "incorrect" | "skipped";

function hasResponse(question: Question, response: unknown): boolean {
  if (question.type === "multiple_select") return Array.isArray(response) && response.length > 0;
  if (question.type === "matching") return Object.keys((response as Record<string, string>) ?? {}).length === (question.response.left?.length ?? 0);
  if (question.type === "true_false_correct") return typeof (response as { value?: unknown })?.value === "boolean";
  return typeof response === "string" && response.trim().length > 0;
}

export function StudyExperience() {
  const [phase, setPhase] = useState<"loading" | "unlock" | "profiles" | "library" | "session" | "summary">("loading");
  const [passphrase, setPassphrase] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [pin, setPin] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bankId, setBankId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [skippedOnce, setSkippedOnce] = useState<string[]>([]);
  const [response, setResponse] = useState<unknown>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, Feedback>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewOrigin, setReviewOrigin] = useState<"session" | "summary">("session");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const current = questions.find((question) => question.id === (reviewingId ?? queue[0]));
  const shownResponse = reviewingId ? responses[reviewingId] : response;
  const shownFeedback = reviewingId ? feedbackByQuestion[reviewingId] : feedback;

  async function loadLibrary() {
    const result = await fetch("/api/study/library", { cache: "no-store" });
    if (result.status === 401) { await loadProfiles(); return; }
    const body = await result.json();
    if (!result.ok) { setError(body.error ?? "Library unavailable."); setPhase("unlock"); return; }
    setChild(body.child ?? null); setChapters(body.chapters ?? []); setPhase("library"); setError("");
  }

  async function loadProfiles() {
    const result = await fetch("/api/child/profiles", { cache: "no-store" });
    if (result.status === 401) { setPhase("unlock"); return; }
    const body = await result.json();
    if (!result.ok) { setError(body.error ?? "Profiles unavailable."); setPhase("unlock"); return; }
    setChildren(body.children ?? []); setSelectedChild(null); setPin(""); setPhase("profiles"); setError("");
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/study/library", { cache: "no-store" }).then(async (result) => {
      if (!active) return;
      if (result.status === 401) { await loadProfiles(); return; }
      const body = await result.json();
      if (!active) return;
      if (!result.ok) { setError(body.error ?? "Library unavailable."); setPhase("unlock"); return; }
      setChild(body.child ?? null); setChapters(body.chapters ?? []); setPhase("library");
    });
    return () => { active = false; };
  }, []);

  async function unlock(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await fetch("/api/child-preview/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passphrase }) });
    const body = await result.json();
    if (!result.ok) setError(body.error ?? "Could not unlock child preview.");
    else await loadProfiles();
    setBusy(false);
  }

  async function childLogin(event: FormEvent) {
    event.preventDefault(); if (!selectedChild) return;
    setBusy(true); setError("");
    const result = await fetch("/api/child/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: selectedChild.id, pin }) });
    const body = await result.json();
    if (!result.ok) setError(body.error ?? "Could not sign in."); else { setChild(body.child); await loadLibrary(); }
    setBusy(false);
  }

  async function switchChild() {
    await fetch("/api/child/logout", { method: "POST" });
    setChild(null); setChapters([]); setQuestions([]); setError(""); await loadProfiles();
  }

  async function start(chapter: Chapter) {
    setBusy(true); setError(""); setBankId(chapter.id);
    const result = await fetch(`/api/study/questions?bankId=${encodeURIComponent(chapter.id)}`);
    const body = await result.json();
    if (!result.ok || !body.questions?.length) { setError(body.error ?? "This chapter needs five objective questions first."); setBusy(false); return; }
    const loaded = body.questions as Question[];
    setQuestions(loaded); setQueue(loaded.map((question) => question.id));
    setStatuses(Object.fromEntries(loaded.map((question) => [question.id, "pending"])));
    setSkippedOnce([]); setFeedback(null); setResponse(""); setResponses({}); setFeedbackByQuestion({}); setReviewingId(null); setPhase("session"); setBusy(false);
  }

  function advance(nextQueue: string[]) {
    setQueue(nextQueue); setFeedback(null); setResponse("");
    if (nextQueue.length === 0) setPhase("summary");
  }

  async function checkAnswer() {
    if (!current) return;
    setBusy(true);
    const result = await fetch("/api/study/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bankId, questionId: current.id, response }) });
    const body = await result.json();
    if (!result.ok) setError(body.error ?? "Could not check this answer.");
    else {
      const checked = body as Feedback;
      setFeedback(checked);
      setResponses((existing) => ({ ...existing, [current.id]: response }));
      setFeedbackByQuestion((existing) => ({ ...existing, [current.id]: checked }));
      setStatuses((existing) => ({ ...existing, [current.id]: checked.correct ? "correct" : "incorrect" }));
    }
    setBusy(false);
  }

  function skip() {
    if (!current) return;
    const alreadySkipped = skippedOnce.includes(current.id);
    setStatuses((existing) => ({ ...existing, [current.id]: "skipped" }));
    if (!alreadySkipped) { setSkippedOnce((items) => [...items, current.id]); advance([...queue.slice(1), current.id]); }
    else advance(queue.slice(1));
  }

  function reviewMistakes() {
    const mistakes = questions.filter((question) => statuses[question.id] === "incorrect").map((question) => question.id);
    if (!mistakes.length) return;
    setQueue(mistakes); setFeedback(null); setResponse(""); setPhase("session");
  }

  function openReview(questionId: string) {
    if (!feedbackByQuestion[questionId]) return;
    setReviewOrigin(phase === "summary" ? "summary" : "session");
    setReviewingId(questionId);
    setPhase("session");
  }

  function closeReview() {
    setReviewingId(null);
    setPhase(reviewOrigin);
  }

  return <main className="study-shell">
    <header className="study-header"><Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link>{child ? <button className="child-switcher" onClick={switchChild}>Studying as {child.displayName} · Switch</button> : <span className="foundation-badge">Family study</span>}</header>

    {phase === "loading" && <p className="study-loading">Opening your study space…</p>}

    {phase === "unlock" && <section className="unlock-card"><p className="eyebrow">Parent step</p><h1>Unlock this device</h1><p>A parent does this once on a family device. After that, each child enters with their own PIN.</p><form onSubmit={unlock}><label>Parent passphrase<input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label><button disabled={!passphrase || busy}>{busy ? "Unlocking…" : "Unlock family study"}</button></form>{error && <p className="notice notice-error" role="alert">{error}</p>}</section>}

    {phase === "profiles" && <section className="profile-picker"><p className="eyebrow">Welcome back</p><h1>Who is studying?</h1>{children.length === 0 ? <div className="empty-study"><p>A parent needs to add a child profile first.</p><Link href="/parent/family">Manage child profiles</Link></div> : <div className="profile-choice-grid">{children.map((item) => <button key={item.id} className={selectedChild?.id === item.id ? "is-selected" : ""} onClick={() => { setSelectedChild(item); setPin(""); setError(""); }}><span className="profile-avatar">{item.displayName.slice(0, 1).toUpperCase()}</span><strong>{item.displayName}</strong><small>{item.board} · Grade {item.grade}</small></button>)}</div>}{selectedChild && <form className="pin-form" onSubmit={childLogin}><label>{selectedChild.displayName}’s PIN<input autoFocus type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} /></label><button disabled={!/^\d{4,8}$/.test(pin) || busy}>{busy ? "Opening…" : "Start studying"}</button></form>}{error && <p className="notice notice-error" role="alert">{error}</p>}</section>}

    {phase === "library" && <section className="chapter-picker"><p className="eyebrow">Choose today’s practice</p><h1>What would you like to study?</h1>{chapters.length === 0 ? <div className="empty-study"><p>No chapters are ready yet.</p><Link href="/parent/library">Import a question bank</Link></div> : <div className="chapter-grid">{chapters.map((chapter) => <button key={chapter.id} onClick={() => start(chapter)} disabled={busy} aria-label={`Study ${chapter.chapterTitle}`}><span>{chapter.board} · Grade {chapter.grade}</span><strong>{chapter.subject}</strong><h2>{chapter.chapterNumber ? `${chapter.chapterNumber}. ` : ""}{chapter.chapterTitle}</h2><small>{Math.min(5, chapter.questionCount)} question practice →</small></button>)}</div>}{error && <p className="notice notice-error">{error}</p>}</section>}

    {phase === "session" && current && <section className="quiz-stage">
      <div className="progress-rail" aria-label="Question progress">{questions.map((question, index) => { const status = statuses[question.id] ?? "pending"; const active = question.id === current.id; const label = `Question ${index + 1}: ${status}${active ? ", current" : ""}`; const symbol = status === "correct" ? "✓" : status === "incorrect" ? "×" : status === "skipped" ? "↻" : index + 1; return feedbackByQuestion[question.id] ? <button type="button" key={question.id} className={`progress-step is-${status}${active ? " is-current" : ""}`} aria-label={`${label}; review answer`} onClick={() => openReview(question.id)}>{symbol}</button> : <span key={question.id} className={`progress-step is-${status}${active ? " is-current" : ""}`} aria-label={label}>{symbol}</span>; })}</div>
      <article className="question-card"><div className="question-meta"><span>{current.type.replaceAll("_", " ")}</span><span>{current.marks} {current.marks === 1 ? "mark" : "marks"}</span></div><h1>{current.prompt}</h1>
        <QuestionInput question={current} value={shownResponse} onChange={setResponse} disabled={Boolean(shownFeedback) || Boolean(reviewingId)} />
        {!shownFeedback ? <div className="question-actions"><button onClick={checkAnswer} disabled={!hasResponse(current, response) || busy}>{busy ? "Checking…" : "Check answer"}</button><button className="button-quiet" onClick={skip}>Skip for now</button></div> : <div className={`answer-feedback ${shownFeedback.correct ? "is-correct" : "is-wrong"}`} role="status"><h2>{shownFeedback.correct ? "✓ Correct" : "× Needs work"}</h2>{!shownFeedback.correct && <p><strong>Expected:</strong> {shownFeedback.expectedAnswer}</p>}<p>{shownFeedback.explanation}</p>{shownFeedback.sourcePages.length > 0 && <p className="source-cite">Textbook {shownFeedback.sourcePages.map((page) => `Page ${page}`).join(", ")}</p>}{reviewingId ? <button onClick={closeReview}>{reviewOrigin === "summary" ? "Back to results" : "Back to current question"}</button> : <button onClick={() => advance(queue.slice(1))}>{queue.length === 1 ? "See results" : "Next question"}</button>}</div>}
      </article>
    </section>}

    {phase === "summary" && <section className="summary-card"><p className="eyebrow">Session complete</p><h1>Nice work showing up.</h1><div className="summary-counts"><div><strong>{Object.values(statuses).filter((value) => value === "correct").length}</strong><span>Correct</span></div><div><strong>{Object.values(statuses).filter((value) => value === "incorrect").length}</strong><span>Needs work</span></div><div><strong>{Object.values(statuses).filter((value) => value === "skipped").length}</strong><span>Skipped</span></div></div><div className="answer-review"><h2>Review your answers</h2><div className="progress-rail">{questions.map((question, index) => feedbackByQuestion[question.id] && <button type="button" key={question.id} className={`progress-step is-${statuses[question.id]}`} aria-label={`Review question ${index + 1}: ${statuses[question.id]}`} onClick={() => openReview(question.id)}>{statuses[question.id] === "correct" ? "✓" : "×"}</button>)}</div></div><div className="question-actions">{Object.values(statuses).includes("incorrect") && <button onClick={reviewMistakes}>Review mistakes</button>}<button className="button-secondary" onClick={() => setPhase("library")}>Choose another chapter</button></div></section>}
  </main>;
}

function QuestionInput({ question, value, onChange, disabled }: { question: Question; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  if (question.type === "single_choice" || question.type === "multiple_select") return <fieldset disabled={disabled} className="choice-list"><legend className="sr-only">Answer choices</legend>{question.response.options?.map((option) => { const checked = question.type === "single_choice" ? value === option.id : Array.isArray(value) && value.includes(option.id); return <label key={option.id}><input type={question.type === "single_choice" ? "radio" : "checkbox"} name="answer" checked={checked} onChange={() => question.type === "single_choice" ? onChange(option.id) : onChange(checked ? (value as string[]).filter((id) => id !== option.id) : [...(Array.isArray(value) ? value : []), option.id])} />{option.text}</label>; })}</fieldset>;
  if (question.type === "fill_blank") return <label className="text-answer">Your answer<input autoComplete="off" disabled={disabled} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} /></label>;
  if (question.type === "true_false_correct") { const answer = (typeof value === "object" && value !== null ? value : {}) as { value?: boolean; correction?: string }; return <div className="true-false"><div className="choice-list"><label><input type="radio" disabled={disabled} checked={answer.value === true} onChange={() => onChange({ value: true, correction: "" })} />True</label><label><input type="radio" disabled={disabled} checked={answer.value === false} onChange={() => onChange({ value: false, correction: "" })} />False</label></div>{answer.value === false && <label className="text-answer">Correct the statement<input disabled={disabled} value={answer.correction ?? ""} onChange={(event) => onChange({ ...answer, correction: event.target.value })} /></label>}</div>; }
  if (question.type === "matching") { const matches = (typeof value === "object" && value !== null ? value : {}) as Record<string, string>; return <div className="matching-list">{question.response.left?.map((left) => <label key={left.id}><span>{left.text}</span><select disabled={disabled} value={matches[left.id] ?? ""} onChange={(event) => onChange({ ...matches, [left.id]: event.target.value })}><option value="">Choose a match</option>{question.response.right?.map((right) => <option key={right.id} value={right.id}>{right.text}</option>)}</select></label>)}</div>; }
  return null;
}
