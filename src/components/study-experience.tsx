"use client";

import Link from "next/link";
import { QUESTIONS_PER_EXERCISE } from "@/lib/study/config";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { ConstellationStatus, MasteryConstellation } from "./progress-visual";
import { useRouter, useSearchParams } from "next/navigation";

type Chapter = { id: string; board: string; grade: number; subject: string; chapterNumber?: number | null; chapterTitle: string; questionCount: number; correctEver?: number; coveragePercent?: number; fullCoverage?: boolean };
type Child = { id: string; displayName: string; board: string; grade: number };
type Option = { id: string; text: string };
type Question = { id: string; type: string; prompt: string; marks: number; response: { options?: Option[]; left?: Option[]; right?: Option[]; requiresCorrectionWhenFalse?: boolean } };
type Feedback = { correct: boolean; earnedMarks: number; expectedAnswer: string; explanation: string; sourcePages: number[]; attemptId: string; reviewRequired?: boolean; confidence?: number; coveredPoints?: string[]; partialPoints?: string[]; missingPoints?: string[] };
type Status = "pending" | "correct" | "partial" | "review" | "incorrect";
type HistoryAttempt = { id: string; question_id?: string; question_prompt: string; response?: unknown; correct: boolean; earned_marks: number; max_marks: number; feedback: Omit<Feedback, "attemptId"> };
type HistorySession = { id: string; bankId: string; status: string; startedAt: string; totalQuestions: number; resumable: boolean; attempts: HistoryAttempt[] };
type History = { summary: { completedSessions: number; attempts: number; uniqueQuestions: number; accuracy: number; mastery: number; dueReview: number }; topics: { topicId: string; attempts: number; accuracy: number; mastery: number }[]; sessions: HistorySession[] };

function hasResponse(question: Question, response: unknown): boolean {
  if (question.type === "multiple_select") return Array.isArray(response) && response.length > 0;
  if (question.type === "matching") return Object.keys((response as Record<string, string>) ?? {}).length === (question.response.left?.length ?? 0);
  if (question.type === "true_false_correct") return typeof (response as { value?: unknown })?.value === "boolean";
  return typeof response === "string" && response.trim().length > 0;
}

function sessionMarks(session: HistorySession) {
  return {
    earned: session.attempts.reduce((sum, attempt) => sum + attempt.earned_marks, 0),
    possible: session.attempts.reduce((sum, attempt) => sum + attempt.max_marks, 0),
  };
}

function resultStatus(result: { correct: boolean; earnedMarks?: number; earned_marks?: number; reviewRequired?: boolean }): Status {
  if (result.reviewRequired) return "review";
  if (result.correct) return "correct";
  return Number(result.earnedMarks ?? result.earned_marks ?? 0) > 0 ? "partial" : "incorrect";
}

function constellationStatuses(questions: Question[], statuses: Record<string, Status>): ConstellationStatus[] {
  return questions.map((question) => statuses[question.id] ?? "pending");
}

export function StudyExperience() {
  const router = useRouter();
  const requestedSessionId = useSearchParams().get("resume");
  const [phase, setPhase] = useState<"loading" | "library" | "session" | "summary" | "history">("loading");
  const [child, setChild] = useState<Child | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bankId, setBankId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [response, setResponse] = useState<unknown>("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, Feedback>>({});
  const [feedbackOpen, setFeedbackOpen] = useState<Record<string, boolean>>({});
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [reportedQuestions, setReportedQuestions] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<History | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewOrigin, setReviewOrigin] = useState<"session" | "summary">("session");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const current = questions.find((question) => question.id === (reviewingId ?? queue[0]));
  const shownResponse = reviewingId ? responses[reviewingId] : response;
  const shownFeedback = reviewingId ? feedbackByQuestion[reviewingId] : feedback;

  async function loadHistory() {
    const result = await fetch("/api/study/history", { cache: "no-store" });
    if (result.ok) setHistory(await result.json());
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/study/library", { cache: "no-store" }).then(async (result) => {
      if (!active) return;
      if (result.status === 401) { router.push("/login?role=child"); return; }
      const body = await result.json();
      if (!active) return;
      if (!result.ok) { setError(body.error ?? "Library unavailable."); return; }
      setChild(body.child ?? null); setChapters(body.chapters ?? []); void loadHistory();
      if (requestedSessionId) void resume(requestedSessionId); else setPhase("library");
    });
    return () => { active = false; };
  }, [requestedSessionId, router]);

  async function start(chapter: Chapter) {
    setBusy(true); setError(""); setBankId(chapter.id);
    const result = await fetch(`/api/study/questions?bankId=${encodeURIComponent(chapter.id)}`);
    const body = await result.json();
    if (!result.ok || !body.questions?.length) { setError(body.error ?? "This chapter needs questions before you can start."); setBusy(false); return; }
    const loaded = body.questions as Question[];
    const sessionResult = await fetch("/api/study/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bankId: chapter.id, questionIds: loaded.map((question) => question.id), presentationSeed: body.presentationSeed }) });
    const sessionBody = await sessionResult.json();
    if (!sessionResult.ok) { setError(sessionBody.error ?? "Could not start this session."); setBusy(false); return; }
    setSessionId(sessionBody.sessionId);
    setQuestions(loaded); setQueue(loaded.map((question) => question.id));
    setStatuses(Object.fromEntries(loaded.map((question) => [question.id, "pending"])));
    setFeedback(null); setResponse(""); setResponses({}); setFeedbackByQuestion({}); setFeedbackOpen({}); setReportNotes({}); setReportedQuestions({}); setReviewingId(null); setPhase("session"); setBusy(false);
  }


  async function resume(session: HistorySession | string) {
    const resumableId = typeof session === "string" ? session : session.id;
    setBusy(true); setError("");
    const result = await fetch(`/api/study/sessions?sessionId=${encodeURIComponent(resumableId)}`, { cache: "no-store" });
    const body = await result.json();
    if (!result.ok) { setError(body.error ?? "Could not resume this session."); setPhase("library"); setBusy(false); return; }
    const loaded = body.questions as Question[];
    const attempts = (body.attempts ?? []) as Array<{ id: string; question_id: string; response: unknown; correct: boolean; earned_marks: number; feedback: Omit<Feedback, "attemptId"> }>;
    const latest = new Map(attempts.map((attempt) => [attempt.question_id, attempt]));
    const remaining = loaded.filter((question) => !latest.has(question.id)).map((question) => question.id);
    setBankId(body.bankId); setSessionId(resumableId); setQuestions(loaded); setQueue(remaining);
    setStatuses(Object.fromEntries(loaded.map((question) => { const attempt = latest.get(question.id); return [question.id, attempt ? resultStatus({ ...attempt, reviewRequired: attempt.feedback.reviewRequired }) : "pending"]; })));
    setResponses(Object.fromEntries(attempts.map((attempt) => [attempt.question_id, attempt.response])));
    setFeedbackByQuestion(Object.fromEntries(attempts.map((attempt) => [attempt.question_id, { ...attempt.feedback, attemptId: attempt.id }])));
    setFeedback(null); setResponse(""); setReviewingId(null); setPhase(remaining.length ? "session" : "summary"); setBusy(false);
  }

  function advance(nextQueue: string[]) {
    setQueue(nextQueue); setFeedback(null); setResponse("");
    if (nextQueue.length === 0) { setPhase("summary"); void fetch("/api/study/sessions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }) }).then(() => loadHistory()); }
  }

  async function submitAnswer(answer: unknown) {
    if (!current) return;
    setBusy(true);
    const result = await fetch("/api/study/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, bankId, questionId: current.id, response: answer }) });
    const body = await result.json();
    if (!result.ok) setError(body.error ?? "Could not check this answer.");
    else {
      const checked = body as Feedback;
      setFeedback(checked);
      setResponses((existing) => ({ ...existing, [current.id]: answer }));
      setFeedbackByQuestion((existing) => ({ ...existing, [current.id]: checked }));
      setStatuses((existing) => ({ ...existing, [current.id]: resultStatus(checked) }));
    }
    setBusy(false);
  }
  async function checkAnswer() { await submitAnswer(response); }
  async function dontKnow() { await submitAnswer(current?.type === "multiple_select" ? [] : current?.type === "matching" ? {} : current?.type === "true_false_correct" ? { value: null } : ""); }

  async function reportCurrentQuestion() {
    if (!current || reportedQuestions[current.id]) return;
    setBusy(true); setError("");
    const result = await fetch("/api/study/question-reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bankId, questionId: current.id, attemptId: shownFeedback?.attemptId, note: reportNotes[current.id] ?? "" }),
    });
    if (result.ok) {
      setReportedQuestions((existing) => ({ ...existing, [current.id]: true }));
      setFeedbackOpen((existing) => ({ ...existing, [current.id]: false }));
    } else setError("Could not send this question to your parent.");
    setBusy(false);
  }

  function reviewMistakes() {
    const firstMistake = questions.find((question) => statuses[question.id] === "incorrect" || statuses[question.id] === "partial");
    if (firstMistake) openReview(firstMistake.id);
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

  const currentIndex = current ? questions.findIndex((question) => question.id === current.id) : -1;
  const answeredCount = Object.values(statuses).filter((status) => status !== "pending").length;
  const correctCount = Object.values(statuses).filter((status) => status === "correct").length;

  return <main className={`study-shell${phase === "session" ? " is-focus-mode" : ""}${phase === "summary" ? " is-finale-mode" : ""}`}>
    <AppHeader role="child" childName={child?.displayName} />

    {phase === "loading" && <p className="study-loading">Opening your study page…</p>}

    {phase === "library" && <section className="chapter-picker">
      <div className="chapter-picker-heading"><p className="eyebrow">Choose a chapter</p><h1>What would you like to study?</h1><p>Choose a chapter to start a focused practice session. Your progress is saved after every answer.</p></div>
      {chapters.length === 0 ? <div className="empty-study"><p>No chapters are ready yet.</p><Link href="/parent/library">Import a question bank</Link></div> : <div className="chapter-grid">{chapters.map((chapter) => { const covered = chapter.correctEver ?? 0; const coverage = chapter.questionCount ? Math.round((covered / chapter.questionCount) * 100) : 0; const exerciseSize = Math.min(QUESTIONS_PER_EXERCISE, chapter.questionCount); return <button className="chapter-card" data-subject={chapter.subject.toLowerCase()} key={chapter.id} onClick={() => start(chapter)} disabled={busy} aria-label={`Study ${chapter.chapterTitle}`}><span className="chapter-card-art"><span className="chapter-orbit" aria-hidden="true" /><MasteryConstellation label={`${chapter.chapterTitle}: ${coverage}% coverage`} progress={coverage} /></span><span className="chapter-card-body"><strong className="chapter-card-subject">{chapter.subject}</strong><h2>{chapter.chapterNumber ? `${chapter.chapterNumber}. ` : ""}{chapter.chapterTitle}</h2><span className="chapter-card-coverage"><span className="chapter-card-coverage-label"><span>{covered} of {chapter.questionCount} covered</span>{chapter.fullCoverage && <em>Complete</em>}</span><span className="chapter-card-progress" role="progressbar" aria-label="Chapter coverage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={coverage}><span style={{ width: `${coverage}%` }} /></span></span><span className="chapter-card-action">Start {exerciseSize}-question exercise <b aria-hidden="true">→</b></span></span></button>; })}</div>}
      {history && history.sessions.some((item) => item.resumable) && <div className="recent-sessions"><h2>Continue studying</h2>{history.sessions.filter((item) => item.resumable).slice(0, 3).map((item) => { const marks = sessionMarks(item); return <article key={item.id} className="recent-session-row"><span>{new Date(item.startedAt).toLocaleDateString()}</span><strong>{marks.earned}/{marks.possible || 0} marks</strong><small>{item.attempts.length} of {item.totalQuestions} answered · Unfinished</small><div><button onClick={() => resume(item)} disabled={busy}>Resume session</button></div></article>; })}</div>}
      {error && <p className="notice notice-error">{error}</p>}
    </section>}

    {phase === "session" && current && <section className="quiz-stage">
      <div className="focus-ambient" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="focus-progress-copy"><span>{reviewingId ? "Reviewing your answer" : `Question ${currentIndex + 1} of ${questions.length}`}</span><strong>{answeredCount} answered</strong></div>
      <div className="progress-rail constellation-progress" aria-label="Question progress">{questions.map((question, index) => { const status = statuses[question.id] ?? "pending"; const active = question.id === current.id; const label = `Question ${index + 1}: ${status}${active ? ", current" : ""}`; const symbol = status === "correct" ? "✓" : status === "partial" ? "½" : status === "review" ? "?" : status === "incorrect" ? "×" : index + 1; return feedbackByQuestion[question.id] ? <button type="button" key={question.id} className={`progress-step is-${status}${active ? " is-current" : ""}`} aria-label={`${label}; review answer`} onClick={() => openReview(question.id)}>{symbol}</button> : <span key={question.id} className={`progress-step is-${status}${active ? " is-current" : ""}`} aria-label={label}>{symbol}</span>; })}</div>
      <article className="question-card" key={`${current.id}-${shownFeedback ? "revealed" : "answer"}`}><div className="question-meta"><span>Question {currentIndex + 1} · {current.type.replaceAll("_", " ")}</span><span>{current.marks} {current.marks === 1 ? "mark" : "marks"}</span></div><h1>{current.prompt}</h1>
        {!reviewingId && <div className="question-feedback"><button type="button" className="question-feedback-link" onClick={() => setFeedbackOpen((existing) => ({ ...existing, [current.id]: !existing[current.id] }))}>{reportedQuestions[current.id] ? "Feedback sent" : "Give feedback"}</button>{feedbackOpen[current.id] && !reportedQuestions[current.id] && <div className="question-feedback-panel"><label>What seems wrong? <span>(optional)</span><textarea rows={2} value={reportNotes[current.id] ?? ""} onChange={(event) => setReportNotes((existing) => ({ ...existing, [current.id]: event.target.value }))} placeholder="For example: the wording is confusing" /></label><div className="button-row"><button type="button" onClick={reportCurrentQuestion} disabled={busy}>{busy ? "Sending…" : "Report question"}</button><button type="button" className="button-quiet" onClick={() => setFeedbackOpen((existing) => ({ ...existing, [current.id]: false }))}>Cancel</button></div></div>}</div>}
        <QuestionInput question={current} value={shownResponse} onChange={setResponse} disabled={Boolean(shownFeedback) || Boolean(reviewingId)} />
        {!shownFeedback ? <div className="question-actions"><button className="answer-submit" onClick={checkAnswer} disabled={!hasResponse(current, response) || busy}>{busy ? "Checking…" : "Check answer"}<span aria-hidden="true">→</span></button><button className="button-quiet" onClick={dontKnow} disabled={busy}>I don’t know</button></div> : <div className={`answer-feedback ${shownFeedback.reviewRequired ? "is-review" : shownFeedback.correct ? "is-correct" : shownFeedback.earnedMarks > 0 ? "is-partial" : "is-wrong"}`} role="status"><div className="feedback-verdict"><span className="verdict-orbit" aria-hidden="true"><i>{shownFeedback.correct ? "✓" : shownFeedback.earnedMarks > 0 ? "½" : shownFeedback.reviewRequired ? "?" : "×"}</i></span><div><span className="feedback-kicker">{shownFeedback.reviewRequired ? "Parent review required" : shownFeedback.earnedMarks > 0 && !shownFeedback.correct ? "Partial credit" : "Answer checked"}</span><h2>{shownFeedback.reviewRequired ? `? Parent review needed — ${shownFeedback.earnedMarks}/${current.marks} provisional marks` : shownFeedback.correct ? "✓ Correct" : shownFeedback.earnedMarks > 0 ? `½ Partly correct — ${shownFeedback.earnedMarks}/${current.marks} marks` : "× Incorrect"}</h2></div></div>{!shownFeedback.correct && <p className="expected-answer"><strong>Expected:</strong> {shownFeedback.expectedAnswer}</p>}<p className="feedback-explanation">{shownFeedback.explanation}</p>{shownFeedback.coveredPoints?.length ? <div className="rubric-feedback"><strong>Points covered</strong><ul>{shownFeedback.coveredPoints.map((point) => <li key={point}>{point}</li>)}</ul></div> : null}{shownFeedback.partialPoints?.length ? <div className="rubric-feedback"><strong>Partly covered</strong><ul>{shownFeedback.partialPoints.map((point) => <li key={point}>{point}</li>)}</ul></div> : null}{shownFeedback.missingPoints?.length ? <div className="rubric-feedback"><strong>Points to add</strong><ul>{shownFeedback.missingPoints.map((point) => <li key={point}>{point}</li>)}</ul></div> : null}{shownFeedback.sourcePages.length > 0 && <p className="source-cite source-seal"><span aria-hidden="true">▤</span> Textbook {shownFeedback.sourcePages.map((page) => `Page ${page}`).join(", ")}</p>}<div className="feedback-next">{reviewingId ? <button onClick={closeReview}>{reviewOrigin === "summary" ? "Back to results" : "Back to current question"}</button> : <button onClick={() => advance(queue.slice(1))}>{queue.length === 1 ? "See results" : "Next question"}<span aria-hidden="true">→</span></button>}</div></div>}
      </article>
    </section>}

    {phase === "summary" && <section className="summary-card constellation-finale"><div className="finale-copy"><p className="eyebrow">Session complete</p><span className="chapter-stamp" aria-hidden="true">✓<small>Session<br />complete</small></span><h1>{correctCount === questions.length ? "Excellent work." : "Good work. Keep practising."}</h1><p>You answered all {questions.length} questions and got {correctCount} correct. Review the breakdown and any answers you want to revisit.</p></div><div className="finale-sky"><MasteryConstellation label={`Session results: ${correctCount} correct out of ${questions.length}`} statuses={constellationStatuses(questions, statuses)} /><span>Answer overview</span></div><div className="summary-counts"><div><strong>{correctCount}</strong><span>Correct</span></div><div><strong>{Object.values(statuses).filter((value) => value === "partial").length}</strong><span>Partly correct</span></div><div><strong>{Object.values(statuses).filter((value) => value === "review").length}</strong><span>Needs review</span></div><div><strong>{Object.values(statuses).filter((value) => value === "incorrect").length}</strong><span>Incorrect</span></div></div><div className="answer-review"><h2>Review your answers</h2><div className="progress-rail">{questions.map((question, index) => feedbackByQuestion[question.id] && <button type="button" key={question.id} className={`progress-step is-${statuses[question.id]}`} aria-label={`Review question ${index + 1}: ${statuses[question.id]}`} onClick={() => openReview(question.id)}>{statuses[question.id] === "correct" ? "✓" : statuses[question.id] === "partial" ? "½" : statuses[question.id] === "review" ? "?" : "×"}</button>)}</div></div><div className="question-actions finale-actions">{(Object.values(statuses).includes("incorrect") || Object.values(statuses).includes("partial")) && <button onClick={reviewMistakes}>Review mistakes</button>}<button className="button-secondary" onClick={() => setPhase("library")}>Choose another chapter</button></div></section>}

  </main>;
}

function QuestionInput({ question, value, onChange, disabled }: { question: Question; value: unknown; onChange: (value: unknown) => void; disabled: boolean }) {
  if (question.type === "single_choice" || question.type === "multiple_select") return <fieldset disabled={disabled} className="choice-list"><legend className="sr-only">Answer choices</legend>{question.response.options?.map((option) => { const checked = question.type === "single_choice" ? value === option.id : Array.isArray(value) && value.includes(option.id); return <label key={option.id}><input type={question.type === "single_choice" ? "radio" : "checkbox"} name="answer" checked={checked} onChange={() => question.type === "single_choice" ? onChange(option.id) : onChange(checked ? (value as string[]).filter((id) => id !== option.id) : [...(Array.isArray(value) ? value : []), option.id])} />{option.text}</label>; })}</fieldset>;
  if (question.type === "fill_blank" || question.type === "one_word") return <label className="text-answer">Your answer<input autoComplete="off" disabled={disabled} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} /></label>;
  if (question.type === "brief_answer" || question.type === "multi_point" || question.type === "compare") return <label className="text-answer">Your answer<textarea autoComplete="off" disabled={disabled} rows={question.type === "brief_answer" ? 4 : 7} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder="Write the important points in your own words." /></label>;
  if (question.type === "true_false_correct") { const answer = (typeof value === "object" && value !== null ? value : {}) as { value?: boolean; correction?: string }; return <div className="true-false"><div className="choice-list"><label><input type="radio" disabled={disabled} checked={answer.value === true} onChange={() => onChange({ value: true, correction: "" })} />True</label><label><input type="radio" disabled={disabled} checked={answer.value === false} onChange={() => onChange({ value: false, correction: "" })} />False</label></div>{answer.value === false && <label className="text-answer">Correct the statement<input disabled={disabled} value={answer.correction ?? ""} onChange={(event) => onChange({ ...answer, correction: event.target.value })} /></label>}</div>; }
  if (question.type === "matching") { const matches = (typeof value === "object" && value !== null ? value : {}) as Record<string, string>; return <div className="matching-list">{question.response.left?.map((left) => <label key={left.id}><span>{left.text}</span><select disabled={disabled} value={matches[left.id] ?? ""} onChange={(event) => onChange({ ...matches, [left.id]: event.target.value })}><option value="">Choose a match</option>{question.response.right?.map((right) => <option key={right.id} value={right.id}>{right.text}</option>)}</select></label>)}</div>; }
  return null;
}
