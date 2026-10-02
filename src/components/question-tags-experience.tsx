"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type Question = { id: string; number: number; kind: string; prompt: string; options?: { id: string; text: string }[]; origin: string };
type Result = { id: string; number: number; correct: boolean; expectedAnswer: string; explanation: string };
type Batch = { batchIndex: number; answers: string[]; results: Result[] };
type Lesson = { title: string; subject: string; batchSize: number };

const ENDPOINT = "/api/study/grammar/question-tags";

export function QuestionTagsExperience() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [childName, setChildName] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [phase, setPhase] = useState<"loading" | "rules" | "practice" | "complete">("loading");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const batchCount = lesson && questions.length ? Math.ceil(questions.length / lesson.batchSize) : 0;
  const saved = batches.find((batch) => batch.batchIndex === batchIndex);
  const checked = saved && !editing ? saved : null;
  const currentQuestions = lesson ? questions.slice(batchIndex * lesson.batchSize, (batchIndex + 1) * lesson.batchSize) : [];
  const correctCount = batches.reduce((count, batch) => count + batch.results.filter((result) => result.correct).length, 0);

  useEffect(() => {
    let active = true;
    void fetch(ENDPOINT, { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.push("/login?role=child"); return; }
      const body = await response.json();
      if (!active) return;
      if (!response.ok) { setError(body.error ?? "Could not open Question Tags."); return; }
      const loaded = body.batches as Batch[];
      const size = Number(body.lesson.batchSize);
      const firstUnfinished = Array.from({ length: Math.ceil(body.questions.length / size) }, (_, index) => index).find((index) => !loaded.some((batch) => batch.batchIndex === index));
      setLesson(body.lesson); setQuestions(body.questions); setBatches(loaded); setChildName(body.child?.displayName ?? "");
      setBatchIndex(firstUnfinished ?? 0);
      setAnswers(loaded.find((batch) => batch.batchIndex === (firstUnfinished ?? 0))?.answers ?? Array(size).fill(""));
      setPhase(firstUnfinished === undefined ? "complete" : "rules");
    }).catch(() => { if (active) setError("Could not open Question Tags."); });
    return () => { active = false; };
  }, [router]);

  function openBatch(index: number) {
    const previous = batches.find((batch) => batch.batchIndex === index);
    setBatchIndex(index); setAnswers(previous?.answers ?? Array(lesson?.batchSize ?? 5).fill(""));
    setEditing(false); setError(""); setPhase("practice");
  }

  async function checkBatch() {
    setBusy(true); setError("");
    try {
      const response = await fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ batchIndex, answers }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not check these answers.");
      const batch = body.batch as Batch;
      setBatches((existing) => [...existing.filter((item) => item.batchIndex !== batchIndex), batch].sort((a, b) => a.batchIndex - b.batchIndex));
      setEditing(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not check these answers."); }
    finally { setBusy(false); }
  }

  function nextBatch() {
    const unfinished = Array.from({ length: batchCount }, (_, index) => index).filter((index) => !batches.some((batch) => batch.batchIndex === index));
    const next = unfinished.find((index) => index > batchIndex) ?? unfinished[0];
    if (next === undefined) setPhase("complete");
    else openBatch(next);
  }

  async function restart() {
    setBusy(true); setError("");
    try {
      const response = await fetch(ENDPOINT, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not restart Question Tags.");
      setBatches([]); setBatchIndex(0); setAnswers(Array(lesson?.batchSize ?? 5).fill("")); setEditing(false); setPhase("rules");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not restart Question Tags."); }
    finally { setBusy(false); }
  }

  return <main className="study-shell grammar-shell">
    <AppHeader role="child" childName={childName} />
    <section className="grammar-content">
      <Link className="subject-back" href="/study">← Subjects</Link>
      {phase === "loading" && !error && <p className="study-loading">Opening Question Tags…</p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}

      {phase === "rules" && <>
        <header className="grammar-heading"><p className="eyebrow">English Language · Grammar</p><h1>Question Tags</h1><p>Learn the pattern, then answer five short questions at a time.</p></header>
        <div className="grammar-rule-grid">
          <article><span>1</span><h2>Turn the meaning around</h2><p>A positive statement takes a negative tag: <strong>They are ready, aren’t they?</strong> A negative statement takes a positive tag: <strong>They aren’t ready, are they?</strong></p></article>
          <article><span>2</span><h2>Match the verb and pronoun</h2><p>Use the helping verb and replace the subject with a pronoun: <strong>Arjun can swim, can’t he?</strong> When there is no helping verb, use <strong>do, does,</strong> or <strong>did</strong>: <strong>Riya sings, doesn’t she?</strong></p></article>
          <article><span>3</span><h2>Spot hidden negatives</h2><p><strong>Nobody, nothing, never, rarely, seldom, hardly,</strong> and <strong>few</strong> make a statement negative in meaning: <strong>She rarely complains, does she?</strong> Use <strong>they</strong> for an unspecified person and <strong>it</strong> for <strong>nothing</strong>.</p></article>
          <article><span>4</span><h2>Remember the special cases</h2><p><strong>I am late, aren’t I?</strong> · <strong>I am not late, am I?</strong> · <strong>Let’s begin, shall we?</strong> · <strong>There is a problem, isn’t there?</strong> For a command, <strong>will you?</strong> is a standard choice.</p></article>
        </div>
        <div className="grammar-worked"><strong>Try the steps:</strong> <em>Nobody has finished the puzzle, ____?</em> “Nobody” is negative in meaning; the tag is positive. “Nobody” becomes “they”, and “has” becomes “have”. <strong>Answer: have they?</strong></div>
        <div className="grammar-actions"><button onClick={() => openBatch(batchIndex)}>Start batch {batchIndex + 1} of {batchCount}</button><span>{batches.length} of {batchCount} batches checked</span></div>
      </>}

      {phase === "practice" && <>
        <header className="grammar-heading"><p className="eyebrow">English Language · Question Tags</p><h1>Batch {batchIndex + 1} of {batchCount}</h1><p>Answer these five together, then check them in one step. A blank answer is okay if you do not know it.</p></header>
        <div className="grammar-batch-nav" aria-label="Question batches">{Array.from({ length: batchCount }, (_, index) => <button key={index} type="button" aria-current={index === batchIndex ? "step" : undefined} className={index === batchIndex ? "is-current" : ""} onClick={() => openBatch(index)}>{index + 1}{batches.some((batch) => batch.batchIndex === index) ? " ✓" : ""}</button>)}</div>
        <div className="grammar-questions">{currentQuestions.map((question, index) => {
          const result = checked?.results[index];
          return <article className={`grammar-question${result ? result.correct ? " is-correct" : " is-incorrect" : ""}`} key={question.id}>
            <p className="grammar-question-number">Question {question.number}{question.origin === "worksheet" ? " · School worksheet" : ""}</p>
            <h2>{question.prompt}</h2>
            {question.kind === "choice" ? <fieldset disabled={Boolean(checked) || busy}><legend>Choose the best tag</legend>{question.options?.map((option) => <label key={option.id}><input type="radio" name={question.id} value={option.id} checked={answers[index] === option.id} onChange={() => setAnswers((existing) => existing.map((answer, position) => position === index ? option.id : answer))} />{option.text}</label>)}</fieldset> : <label className="grammar-answer">{question.kind === "correction" ? "Write the replacement tag" : "Write the missing tag"}<input autoComplete="off" disabled={Boolean(checked) || busy} value={answers[index] ?? ""} onChange={(event) => setAnswers((existing) => existing.map((answer, position) => position === index ? event.target.value : answer))} placeholder="e.g. aren't they" maxLength={100} /></label>}
            {result && <div className="grammar-feedback" role="status"><strong>{result.correct ? "Correct" : `Expected: ${result.expectedAnswer}`}</strong><p>{result.explanation}</p></div>}
          </article>;
        })}</div>
        <div className="grammar-actions">{checked ? <><strong>{checked.results.filter((result) => result.correct).length} of 5 correct</strong><button onClick={nextBatch}>{batches.length === batchCount ? "See results" : "Next five"}</button><button className="button-secondary" onClick={() => setEditing(true)}>Try this batch again</button></> : <button disabled={busy} onClick={() => void checkBatch()}>{busy ? "Checking…" : "Check five answers"}</button>}</div>
      </>}

      {phase === "complete" && <section className="grammar-complete"><p className="eyebrow">English Language · Grammar</p><h1>Question Tags complete</h1><p>You checked all 40 questions in eight short batches.</p><strong>{correctCount} of 40 correct</strong><div className="grammar-actions"><button onClick={() => openBatch(0)}>Review answers</button><button className="button-secondary" disabled={busy} onClick={() => void restart()}>Start again</button><Link href="/study">Back to subjects</Link></div></section>}
    </section>
  </main>;
}
