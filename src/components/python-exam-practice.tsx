"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "./app-header";
import { PythonCodeEditor } from "./python-code-editor";
import { runPythonCases } from "@/lib/python/browser-runner";
import { evaluateProgramCase, PROGRAM_TESTS, type ProgramCase } from "@/lib/python/program-tests";

export type PracticeQuestion = {
  id: string;
  type: string;
  topicIds: string[];
  marks: number;
  prompt: string;
  response: { options?: { id: string; text: string }[]; editor?: string };
  answer: { correctOptionId?: string; accepted?: string[]; ideal?: string };
  hint: string;
  explanation: string;
};
type PracticeState = { answers: Record<string, string>; checked: Record<string, boolean>; passed: Record<string, boolean> };
const INITIAL: PracticeState = { answers: {}, checked: {}, passed: {} };
const STORAGE_KEY = "studycraft-python-exam-practice-v2";
const PENDING_KEY = "studycraft-python-exam-practice-pending-v1";
type ProgressEntry = { questionId: string; answer: string; checked: boolean; passed: boolean };

function readSaved(childId: string): PracticeState {
  try {
    const value = typeof window !== "undefined" ? localStorage.getItem(`${STORAGE_KEY}:${childId}`) : null;
    const parsed = value ? JSON.parse(value) : null;
    if (parsed && typeof parsed === "object" && parsed.answers && parsed.checked && parsed.passed) return parsed;
  } catch { /* practice works without browser storage */ }
  return INITIAL;
}
function readPending(childId: string): Record<string, ProgressEntry> {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${PENDING_KEY}:${childId}`) ?? "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch { /* account sync can retry after this visit */ }
  return {};
}
function entryFrom(state: PracticeState, questionId: string): ProgressEntry {
  return { questionId, answer: state.answers[questionId] ?? "", checked: Boolean(state.checked[questionId]), passed: Boolean(state.passed[questionId]) };
}
function withEntry(state: PracticeState, item: ProgressEntry): PracticeState {
  return { answers: { ...state.answers, [item.questionId]: item.answer }, checked: { ...state.checked, [item.questionId]: item.checked }, passed: { ...state.passed, [item.questionId]: item.passed } };
}
function normalized(value: string) { return value.trim().replace(/\s+/g, " ").toLowerCase(); }
function correct(question: PracticeQuestion, answer: string) {
  if (question.type === "single_choice") return answer === question.answer.correctOptionId;
  if (question.type === "fill_blank") return (question.answer.accepted ?? []).some((accepted) => normalized(answer) === normalized(accepted));
  return false;
}
function expected(question: PracticeQuestion) {
  if (question.type === "single_choice") return question.response.options?.find((option) => option.id === question.answer.correctOptionId)?.text ?? "";
  return (question.answer.accepted ?? []).join(" / ");
}
const PROGRAM_LABELS: Record<string, string> = {
  "q-031": "Fix the code", "q-032": "if…else syntax", "q-033": "Positive number", "q-034": "Even or odd", "q-035": "Greater number", "q-036": "Grade ladder", "q-037": "Water meter", "q-038": "Angle type", "q-039": "Higher test mark", "q-040": "Award by field", "q-041": "Spy number", "q-042": "Grocery delivery", "q-043": "Profit or loss", "q-044": "Area or circumference", "q-045": "24-hour time"
};
function examOrder(questions: PracticeQuestion[]) {
  const objective = questions.filter((question) => question.response.editor !== "python");
  const programs = questions.filter((question) => question.response.editor === "python");
  const result: PracticeQuestion[] = [];
  while (objective.length || programs.length) {
    result.push(...objective.splice(0, 2));
    result.push(...programs.splice(0, 1));
  }
  return result;
}
function firstUnfinished(questions: PracticeQuestion[], state: PracticeState) {
  return questions.findIndex((item) => item.response.editor === "python"
    ? !state.passed[item.id]
    : !state.checked[item.id] || !correct(item, state.answers[item.id] ?? ""));
}

export function PythonExamPractice({ questions }: { questions: PracticeQuestion[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [childId, setChildId] = useState("");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<"programs" | "exam">("programs");
  const [position, setPosition] = useState(0);
  const [state, setState] = useState<PracticeState>(INITIAL);
  const [hintOpen, setHintOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [programFeedback, setProgramFeedback] = useState<Record<string, { test: ProgramCase; output: string; error: string; passed: boolean }[]>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"syncing" | "synced" | "local">("syncing");
  const pending = useRef<Record<string, ProgressEntry>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());
  const ordered = useMemo(() => examOrder(questions), [questions]);
  const programs = useMemo(() => questions.filter((item) => item.response.editor === "python").sort((a, b) => {
    const rank = (marks: number) => marks === 5 ? 0 : marks === 7 ? 1 : 2;
    return rank(a.marks) - rank(b.marks);
  }), [questions]);
  const visible = mode === "programs" ? programs : ordered;
  const question = visible[Math.min(position, visible.length - 1)];
  useEffect(() => {
    let active = true;
    const scheduled = timers.current;
    void fetch("/api/study/library", { cache: "no-store" }).then(async (result) => {
      if (result.status === 401) { router.replace("/login?role=child"); return; }
      if (!result.ok) { setLoadError("Could not open practice. Please refresh the page."); return; }
      const body = await result.json(); const id = String(body.child?.id ?? "");
      const local = readSaved(id);
      let next = local;
      const unsynced = readPending(id);
      try {
        const response = await fetch("/api/study/python-progress", { cache: "no-store" });
        if (!response.ok) throw new Error("Account progress unavailable");
        const remote = (await response.json()).entries as ProgressEntry[];
        const remoteIds = new Set<string>();
        next = INITIAL;
        for (const item of remote) { if (!questions.some((question) => question.id === item.questionId)) continue; next = withEntry(next, item); remoteIds.add(item.questionId); }
        for (const question of questions) {
          if (!remoteIds.has(question.id) && (question.id in local.answers || question.id in local.checked || question.id in local.passed)) {
            const item = entryFrom(local, question.id);
            unsynced[question.id] = item;
          }
        }
        for (const item of Object.values(unsynced)) { if (questions.some((question) => question.id === item.questionId)) next = withEntry(next, item); }
        if (active) setSyncStatus(Object.keys(unsynced).length ? "syncing" : "synced");
      } catch { if (active) setSyncStatus("local"); }
      if (!active) return;
      pending.current = unsynced;
      try { localStorage.setItem(`${STORAGE_KEY}:${id}`, JSON.stringify(next)); } catch { /* keep editing */ }
      persistPending(id);
      setChildId(id); setState(next); setName(body.child?.displayName ?? ""); setReady(true);
      for (const questionId of Object.keys(unsynced)) flush(questionId, id);
    }).catch(() => setLoadError("Could not open practice. Please refresh the page."));
    return () => { active = false; for (const timer of Object.values(scheduled)) clearTimeout(timer); };
  // The initial account load should run once for this child session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
  function persistPending(id: string) {
    try { localStorage.setItem(`${PENDING_KEY}:${id}`, JSON.stringify(pending.current)); } catch { /* keep editing */ }
  }
  function flush(questionId: string, id = childId) {
    clearTimeout(timers.current[questionId]);
    delete timers.current[questionId];
    const item = pending.current[questionId];
    if (!item) return;
    queue.current = queue.current.then(async () => {
      const response = await fetch("/api/study/python-progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) });
      if (!response.ok) throw new Error("Could not sync practice");
      if (JSON.stringify(pending.current[questionId]) === JSON.stringify(item)) {
        delete pending.current[questionId];
        persistPending(id);
      }
      setSyncStatus(Object.keys(pending.current).length ? "syncing" : "synced");
    }).catch(() => setSyncStatus("local"));
  }
  function save(next: PracticeState, questionId: string, immediate = false) {
    setState(next);
    try { localStorage.setItem(`${STORAGE_KEY}:${childId}`, JSON.stringify(next)); } catch { /* practice remains usable */ }
    pending.current[questionId] = entryFrom(next, questionId);
    persistPending(childId);
    setSyncStatus("syncing");
    clearTimeout(timers.current[questionId]);
    if (immediate) flush(questionId);
    else timers.current[questionId] = setTimeout(() => flush(questionId), 650);
  }
  function answer(value: string) {
    save({ ...state, answers: { ...state.answers, [question.id]: value }, checked: { ...state.checked, [question.id]: false }, passed: { ...state.passed, [question.id]: false } }, question.id);
    setProgramFeedback((old) => { const next = { ...old }; delete next[question.id]; return next; });
    setRunError(""); setShowSolution(false);
  }
  async function checkAnswer() {
    if (!written) { save({ ...state, checked: { ...state.checked, [question.id]: true } }, question.id, true); return; }
    const tests = PROGRAM_TESTS[question.id];
    if (!tests?.length) { setRunError("Checks are not ready for this program."); return; }
    setRunning(true); setRunError(""); setShowSolution(false);
    setProgramFeedback((old) => { const next = { ...old }; delete next[question.id]; return next; });
    try {
      const results = await runPythonCases(value, tests);
      if (results.length !== tests.length) throw new Error("Python did not finish every check. Please try again.");
      const feedback = tests.map((test, index) => ({ test, ...results[index], passed: evaluateProgramCase(test, results[index]) }));
      setProgramFeedback((old) => ({ ...old, [question.id]: feedback }));
      save({ ...state, passed: { ...state.passed, [question.id]: feedback.every((item) => item.passed) } }, question.id, true);
    } catch (error) { setRunError(error instanceof Error ? error.message : "Could not run Python. Please try again."); }
    finally { setRunning(false); }
  }
  function restart() {
    save(withEntry(state, { questionId: question.id, answer: "", checked: false, passed: false }), question.id, true);
    setProgramFeedback((old) => { const next = { ...old }; delete next[question.id]; return next; });
    setRunError(""); setShowSolution(false); setHintOpen(false);
  }
  function changeMode(next: "programs" | "exam") {
    setMode(next);
    const nextPosition = next === "exam" ? firstUnfinished(ordered, state) : firstUnfinished(programs, state);
    setPosition(nextPosition < 0 ? 0 : nextPosition);
    setHintOpen(false);
  }
  function go(delta: number) { setPosition((old) => Math.max(0, Math.min(visible.length - 1, old + delta))); setHintOpen(false); }
  const written = question?.response.editor === "python";
  const submitted = question ? Boolean(state.checked[question.id]) : false;
  const value = question ? state.answers[question.id] ?? "" : "";
  const passedCount = questions.filter((item) => state.passed[item.id]).length;
  const correctCount = questions.filter((item) => item.response.editor !== "python" && state.checked[item.id] && correct(item, state.answers[item.id] ?? "")).length;
  const nextUnfinished = mode === "exam" ? firstUnfinished(ordered, state) : -1;
  return <main className="study-shell python-practice-page"><AppHeader role="child" childName={name} />{!ready ? <p className="study-loading">{loadError || "Opening Python practice…"}</p> : <>
    <section className="python-hero"><p className="eyebrow">Computer Studies</p><h1>Python Programming</h1></section>
    <nav className="python-practice-tabs" aria-label="Practice mode"><button type="button" className={mode === "programs" ? "is-active" : ""} disabled={running} onClick={() => changeMode("programs")}>Write Python programs</button><button type="button" className={mode === "exam" ? "is-active" : ""} disabled={running} onClick={() => changeMode("exam")}>Exam-style Python mix</button>{mode === "exam" && nextUnfinished >= 0 && position !== nextUnfinished && <button type="button" disabled={running} onClick={() => { setPosition(nextUnfinished); setHintOpen(false); }}>Jump to next unfinished</button>}</nav>
    <section className="python-practice-summary" aria-label="Practice progress"><span>{passedCount} {passedCount === 1 ? "program" : "programs"} passed</span><span>{correctCount} {correctCount === 1 ? "short question" : "short questions"} correct</span>{syncStatus === "local" && <span role="status">Sync unavailable. Progress may stay on this device.</span>}</section>
    {mode === "programs" && <nav className="python-program-picker" aria-label="Choose a programming question">{programs.map((item, index) => <button type="button" key={item.id} className={`${position === index ? "is-active " : ""}${state.passed[item.id] ? "is-complete" : ""}`} disabled={running} onClick={() => { setPosition(index); setHintOpen(false); }}><span>{state.passed[item.id] && <span aria-hidden="true" className="python-complete-check">✓ </span>}{PROGRAM_LABELS[item.id] ?? `Program ${index + 1}`}</span><small>{item.marks} marks{state.passed[item.id] ? " · Completed" : ""}</small></button>)}</nav>}
    {question && <article className="python-exam-card"><div className="python-section-heading"><div><p className="eyebrow">Question {position + 1} of {visible.length}</p><h2>{written ? PROGRAM_LABELS[question.id] ?? "Python program" : question.topicIds[0]?.replaceAll("-", " ")}</h2></div><span>{question.marks} {question.marks === 1 ? "mark" : "marks"}</span></div><p className="python-exam-prompt">{question.prompt}</p>
      {written ? <PythonCodeEditor label="Write your Python answer" value={value} onChange={answer} disabled={running} /> : question.type === "single_choice" ? <fieldset className="choice-list"><legend className="sr-only">Choose an answer</legend>{question.response.options?.map((option) => <label key={option.id}><input type="radio" name={`answer-${question.id}`} checked={value === option.id} onChange={() => answer(option.id)} />{option.text}</label>)}</fieldset> : <label className="text-answer">Your answer<input autoComplete="off" value={value} onChange={(event) => answer(event.target.value)} /></label>}
      <div className="python-exam-actions"><button type="button" className="button-quiet" onClick={() => setHintOpen(!hintOpen)}>{hintOpen ? "Hide hint" : "Need a hint?"}</button><button type="button" className="button" disabled={running || !value.trim()} onClick={checkAnswer}>{written ? running ? "Running Python…" : "Run checks" : "Check answer"}</button>{(value || submitted || state.passed[question.id]) && <button type="button" className="button-quiet" disabled={running} onClick={restart}>Restart this {written ? "program" : "question"}</button>}</div>{hintOpen && <p className="python-exam-hint">{question.hint}</p>}
      {runError && <p className="notice notice-error" role="alert">{runError}</p>}
      {written && programFeedback[question.id] && <div className="python-exam-feedback" role="status"><h3>{programFeedback[question.id].filter((item) => item.passed).length} of {programFeedback[question.id].length} test cases passed</h3><ul className="python-case-results">{programFeedback[question.id].map((item) => <li key={item.test.name} className={item.passed ? "is-correct" : "is-incorrect"}><strong>{item.passed ? "✓" : "×"} {item.test.name}</strong><span>Input: {item.test.input.length ? item.test.input.join(", ") : "none"}</span><span>Expected: {item.test.expected}</span><span>Your output: {item.error ? item.error : item.output.trim() || "(no output)"}</span></li>)}</ul>{programFeedback[question.id].every((item) => item.passed) && <><button type="button" className="button-quiet" onClick={() => setShowSolution(!showSolution)}>{showSolution ? "Hide one solution" : "See one solution"}</button>{showSolution && <pre><code>{question.answer.ideal}</code></pre>}</>}</div>}
      {submitted && !written && <div className={`python-exam-feedback ${correct(question, value) ? "is-correct" : "is-incorrect"}`} role="status"><h3>{correct(question, value) ? "Correct" : "Check this one again"}</h3><p><strong>Answer:</strong> {expected(question)}</p><p>{question.explanation}</p></div>}
      <div className="python-lesson-actions"><button type="button" disabled={running || position === 0} onClick={() => go(-1)}>← Previous</button><button type="button" disabled={running || position === visible.length - 1} onClick={() => go(1)}>Next question →</button></div></article>}
    <section className="python-next"><h2>Conditional Statements</h2><Link className="button" href="/study/python">Review lesson →</Link></section>
  </>}</main>;
}
