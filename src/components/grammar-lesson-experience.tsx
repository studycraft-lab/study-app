"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type Slug = "prepositions" | "conjunctions" | "tenses" | "pronouns" | "adjectives";
type Question = { id: string; number: number; kind: "fill" | "join" | "choice" | "rewrite" | "identify"; prompt: string; origin: string; options?: { id: string; text: string }[]; context?: string; blankNumber?: number };
type Result = { id: string; number: number; status: "correct" | "incorrect" | "review"; expectedAnswer: string; explanation: string };
type Batch = { batchIndex: number; answers: string[]; results: Result[] };
type Lesson = { title: string; batchSize: number; introduction: string; rules: { title: string; body: string; example: string }[]; worked: { prompt: string; answer: string; explanation: string } };

export function GrammarLessonExperience({ slug }: { slug: Slug }) {
  const router = useRouter();
  const endpoint = `/api/study/grammar/${slug}`;
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
  const batchCount = lesson && questions.length ? questions.length / lesson.batchSize : 0;
  const saved = batches.find((batch) => batch.batchIndex === batchIndex);
  const checked = saved && !editing ? saved : null;
  const currentQuestions = lesson ? questions.slice(batchIndex * lesson.batchSize, (batchIndex + 1) * lesson.batchSize) : [];
  const passage = currentQuestions.find((question) => question.context)?.context;
  const correctCount = batches.reduce((count, batch) => count + batch.results.filter((result) => result.status === "correct").length, 0);
  const reviewCount = batches.reduce((count, batch) => count + batch.results.filter((result) => result.status === "review").length, 0);

  useEffect(() => {
    let active = true;
    void fetch(endpoint, { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.push("/login?role=child"); return; }
      const body = await response.json();
      if (!active) return;
      if (!response.ok) { setError(body.error ?? "Could not open lesson."); return; }
      const loaded = body.batches as Batch[];
      const size = Number(body.lesson.batchSize);
      const first = Array.from({ length: body.questions.length / size }, (_, index) => index).find((index) => !loaded.some((batch) => batch.batchIndex === index));
      setLesson(body.lesson); setQuestions(body.questions); setBatches(loaded); setChildName(body.child?.displayName ?? "");
      setBatchIndex(first ?? 0); setAnswers(loaded.find((batch) => batch.batchIndex === (first ?? 0))?.answers ?? Array(size).fill(""));
      setPhase(first === undefined ? "complete" : "rules");
    }).catch(() => { if (active) setError("Could not open lesson."); });
    return () => { active = false; };
  }, [endpoint, router]);

  function openBatch(index: number) {
    const previous = batches.find((batch) => batch.batchIndex === index);
    setBatchIndex(index); setAnswers(previous?.answers ?? Array(lesson?.batchSize ?? 5).fill(""));
    setEditing(false); setError(""); setPhase("practice");
  }
  function setAnswer(index: number, value: string) { setAnswers((existing) => existing.map((answer, position) => position === index ? value : answer)); }
  async function checkBatch() {
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ batchIndex, answers }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not check these answers.");
      const batch = body.batch as Batch;
      setBatches((existing) => [...existing.filter((item) => item.batchIndex !== batchIndex), batch].sort((a, b) => a.batchIndex - b.batchIndex));
      setEditing(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not check these answers."); }
    finally { setBusy(false); }
  }
  function nextBatch() {
    const next = Array.from({ length: batchCount }, (_, index) => index).find((index) => !batches.some((batch) => batch.batchIndex === index));
    if (next === undefined) setPhase("complete"); else openBatch(next);
  }
  async function restart() {
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error ?? "Could not restart lesson.");
      setBatches([]); setBatchIndex(0); setAnswers(Array(lesson?.batchSize ?? 5).fill("")); setEditing(false); setPhase("rules");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not restart lesson."); }
    finally { setBusy(false); }
  }
  return <main className="study-shell grammar-shell">
    <AppHeader role="child" childName={childName} />
    <section className="grammar-content">
      <Link className="subject-back" href="/study">← Subjects</Link>
      {phase === "loading" && !error && <p className="study-loading">Opening lesson…</p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {phase === "rules" && lesson && <>
        <header className="grammar-heading"><p className="eyebrow">English Language · Grammar</p><h1>{lesson.title}</h1><p>{lesson.introduction}</p></header>
        <div className="grammar-rule-grid">{lesson.rules.map((rule, index) => <article key={rule.title}><span>{index + 1}</span><h2>{rule.title}</h2><p>{rule.body}</p><p><strong>{rule.example}</strong></p></article>)}</div>
        <div className="grammar-worked"><strong>Worked example:</strong> <em>{lesson.worked.prompt}</em> <strong>Answer: {lesson.worked.answer}</strong> {lesson.worked.explanation}</div>
        <div className="grammar-actions"><button onClick={() => openBatch(batchIndex)}>Start batch {batchIndex + 1} of {batchCount}</button><span>{batches.length} of {batchCount} batches checked</span></div>
      </>}
      {phase === "practice" && lesson && <>
        <header className="grammar-heading"><p className="eyebrow">English Language · {lesson.title}</p><h1>Batch {batchIndex + 1} of {batchCount}</h1><p>Answer these five together, then check them in one step. You may leave an answer blank.</p></header>
        <div className="grammar-batch-nav" aria-label="Question batches">{Array.from({ length: batchCount }, (_, index) => <button key={index} type="button" aria-current={index === batchIndex ? "step" : undefined} className={index === batchIndex ? "is-current" : ""} onClick={() => openBatch(index)}>{index + 1}{batches.some((batch) => batch.batchIndex === index) ? " ✓" : ""}</button>)}</div>
        {passage && <details className="grammar-worked" open><summary>Read the past-paper passage</summary><p>{passage}</p></details>}
        <div className="grammar-questions">{currentQuestions.map((question, index) => {
          const result = checked?.results[index];
          return <article className={`grammar-question${result?.status === "correct" ? " is-correct" : result?.status === "incorrect" ? " is-incorrect" : ""}`} key={question.id}>
            <p className="grammar-question-number">Question {question.number}{question.origin === "worksheet" ? " · School worksheet" : question.origin === "past_paper" ? " · Last year’s paper" : ""}</p>
            <h2>{question.prompt}</h2>
            {question.kind === "choice" ? <fieldset disabled={Boolean(checked) || busy}><legend>Choose the best answer</legend>{question.options?.map((option) => <label key={option.id}><input type="radio" name={question.id} value={option.id} checked={answers[index] === option.id} onChange={() => setAnswer(index, option.id)} />{option.text}</label>)}</fieldset>
              : <label className={`grammar-answer${question.kind === "join" || question.kind === "rewrite" ? " grammar-answer-join" : ""}`}>{question.kind === "join" ? "Join the sentences without using and, but or so" : question.kind === "rewrite" ? "Rewrite the complete sentence" : question.kind === "identify" ? slug === "adjectives" ? "Write the adjective and its kind, e.g. vast — quality" : "Write the pronoun and its kind, e.g. that — relative" : question.blankNumber ? `Write the word for blank ${question.blankNumber}` : "Write the missing word or phrase"}
                {question.kind === "join" || question.kind === "rewrite" ? <textarea disabled={Boolean(checked) || busy} value={answers[index] ?? ""} onChange={(event) => setAnswer(index, event.target.value)} maxLength={500} rows={3} />
                  : <input autoComplete="off" disabled={Boolean(checked) || busy} value={answers[index] ?? ""} onChange={(event) => setAnswer(index, event.target.value)} maxLength={100} />}</label>}
            {result && <div className="grammar-feedback" role="status"><strong>{result.status === "correct" ? "Correct" : result.status === "review" ? "Review this answer" : `Expected: ${result.expectedAnswer}`}</strong><p>{result.explanation}</p>{result.status === "review" && <p>Model answer: {result.expectedAnswer}</p>}</div>}
          </article>;
        })}</div>
        <div className="grammar-actions">{checked ? <><strong>{checked.results.filter((result) => result.status === "correct").length} of 5 correct{checked.results.some((result) => result.status === "review") ? ` · ${checked.results.filter((result) => result.status === "review").length} for review` : ""}</strong><button onClick={nextBatch}>{batches.length === batchCount ? "See results" : "Next five"}</button><button className="button-secondary" onClick={() => setEditing(true)}>Try this batch again</button></> : <button disabled={busy} onClick={() => void checkBatch()}>{busy ? "Checking…" : "Check five answers"}</button>}</div>
      </>}
      {phase === "complete" && lesson && <section className="grammar-complete"><p className="eyebrow">English Language · Grammar</p><h1>{lesson.title} complete</h1><p>You checked all {questions.length} questions in {batchCount} short batches.</p><strong>{correctCount} of {questions.length} correct{reviewCount ? ` · ${reviewCount} for review` : ""}</strong><div className="grammar-actions"><button onClick={() => openBatch(0)}>Review answers</button><button className="button-secondary" disabled={busy} onClick={() => void restart()}>Start again</button><Link href="/study">Back to subjects</Link></div></section>}
    </section>
  </main>;
}
