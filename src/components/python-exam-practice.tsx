"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function readSaved(childId: string): PracticeState {
  try {
    const value = typeof window !== "undefined" ? localStorage.getItem(`${STORAGE_KEY}:${childId}`) : null;
    const parsed = value ? JSON.parse(value) : null;
    if (parsed && typeof parsed === "object" && parsed.answers && parsed.checked && parsed.passed) return parsed;
  } catch { /* practice works without browser storage */ }
  return INITIAL;
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
  const ordered = useMemo(() => examOrder(questions), [questions]);
  const programs = useMemo(() => questions.filter((item) => item.response.editor === "python").sort((a, b) => {
    const rank = (marks: number) => marks === 5 ? 0 : marks === 7 ? 1 : 2;
    return rank(a.marks) - rank(b.marks);
  }), [questions]);
  const visible = mode === "programs" ? programs : ordered;
  const question = visible[Math.min(position, visible.length - 1)];
  useEffect(() => {
    void fetch("/api/study/library", { cache: "no-store" }).then(async (result) => {
      if (result.status === 401) { router.replace("/login?role=child"); return; }
      if (!result.ok) { setLoadError("Could not open practice. Please refresh the page."); return; }
      const body = await result.json(); const id = String(body.child?.id ?? ""); setChildId(id); setState(readSaved(id)); setName(body.child?.displayName ?? ""); setReady(true);
    }).catch(() => setLoadError("Could not open practice. Please refresh the page."));
  }, [router]);
  function save(next: PracticeState) {
    setState(next);
    try { localStorage.setItem(`${STORAGE_KEY}:${childId}`, JSON.stringify(next)); } catch { /* practice remains usable */ }
  }
  function answer(value: string) {
    save({ ...state, answers: { ...state.answers, [question.id]: value }, checked: { ...state.checked, [question.id]: false }, passed: { ...state.passed, [question.id]: false } });
    setProgramFeedback((old) => { const next = { ...old }; delete next[question.id]; return next; });
    setRunError(""); setShowSolution(false);
  }
  async function checkAnswer() {
    if (!written) { save({ ...state, checked: { ...state.checked, [question.id]: true } }); return; }
    const tests = PROGRAM_TESTS[question.id];
    if (!tests?.length) { setRunError("Checks are not ready for this program."); return; }
    setRunning(true); setRunError(""); setShowSolution(false);
    setProgramFeedback((old) => { const next = { ...old }; delete next[question.id]; return next; });
    try {
      const results = await runPythonCases(value, tests);
      if (results.length !== tests.length) throw new Error("Python did not finish every check. Please try again.");
      const feedback = tests.map((test, index) => ({ test, ...results[index], passed: evaluateProgramCase(test, results[index]) }));
      setProgramFeedback((old) => ({ ...old, [question.id]: feedback }));
      save({ ...state, passed: { ...state.passed, [question.id]: feedback.every((item) => item.passed) } });
    } catch (error) { setRunError(error instanceof Error ? error.message : "Could not run Python. Please try again."); }
    finally { setRunning(false); }
  }
  function changeMode(next: "programs" | "exam") { setMode(next); setPosition(0); setHintOpen(false); }
  function go(delta: number) { setPosition((old) => Math.max(0, Math.min(visible.length - 1, old + delta))); setHintOpen(false); }
  const written = question?.response.editor === "python";
  const submitted = question ? Boolean(state.checked[question.id]) : false;
  const value = question ? state.answers[question.id] ?? "" : "";
  const passedCount = questions.filter((item) => state.passed[item.id]).length;
  const correctCount = questions.filter((item) => item.response.editor !== "python" && state.checked[item.id] && correct(item, state.answers[item.id] ?? "")).length;
  return <main className="study-shell python-practice-page"><AppHeader role="child" childName={name} />{!ready ? <p className="study-loading">{loadError || "Opening Python practice…"}</p> : <>
    <section className="python-hero"><p className="eyebrow">Computer Studies · Class VI</p><h1>Python Programming</h1><p>Practise the kinds of questions in the supplied computer paper: write programs, trace output, correct code, and revisit Python basics.</p><div><span>{questions.filter((item) => item.response.editor === "python").length} programming questions</span><span>{questions.length} questions in the full mix</span><span>5- and 7-mark exam tasks</span></div></section>
    <nav className="python-practice-tabs" aria-label="Practice mode"><button type="button" className={mode === "programs" ? "is-active" : ""} disabled={running} onClick={() => changeMode("programs")}>Write Python programs</button><button type="button" className={mode === "exam" ? "is-active" : ""} disabled={running} onClick={() => changeMode("exam")}>Exam-style Python mix</button></nav>
    <section className="python-practice-summary" aria-label="Practice progress"><span>{passedCount} programs passed</span><span>{correctCount} short questions correct</span><span>Progress saved on this device</span></section>
    {mode === "programs" && <nav className="python-program-picker" aria-label="Choose a programming question">{programs.map((item, index) => <button type="button" key={item.id} className={position === index ? "is-active" : ""} disabled={running} onClick={() => { setPosition(index); setHintOpen(false); }}>{PROGRAM_LABELS[item.id] ?? `Program ${index + 1}`} <small>{item.marks} marks</small></button>)}</nav>}
    {question && <article className="python-exam-card"><div className="python-section-heading"><div><p className="eyebrow">{mode === "programs" ? "Program writing" : "Exam-style mix"} · Question {position + 1} of {visible.length}</p><h2>{written ? `${question.marks}-mark program` : question.topicIds[0]?.replaceAll("-", " ")}</h2></div><span>{question.marks} {question.marks === 1 ? "mark" : "marks"}</span></div><p className="python-exam-prompt">{question.prompt}</p>
      {written ? <PythonCodeEditor label="Write your Python answer" value={value} onChange={answer} disabled={running} /> : question.type === "single_choice" ? <fieldset className="choice-list"><legend className="sr-only">Choose an answer</legend>{question.response.options?.map((option) => <label key={option.id}><input type="radio" name={`answer-${question.id}`} checked={value === option.id} onChange={() => answer(option.id)} />{option.text}</label>)}</fieldset> : <label className="text-answer">Your answer<input autoComplete="off" value={value} onChange={(event) => answer(event.target.value)} /></label>}
      <div className="python-exam-actions"><button type="button" className="button-quiet" onClick={() => setHintOpen(!hintOpen)}>{hintOpen ? "Hide hint" : "Need a hint?"}</button><button type="button" className="button" disabled={running || !value.trim()} onClick={checkAnswer}>{written ? running ? "Running Python…" : "Run checks" : "Check answer"}</button></div>{hintOpen && <p className="python-exam-hint">{question.hint}</p>}
      {runError && <p className="notice notice-error" role="alert">{runError}</p>}
      {written && programFeedback[question.id] && <div className="python-exam-feedback" role="status"><h3>{programFeedback[question.id].filter((item) => item.passed).length} of {programFeedback[question.id].length} test cases passed</h3><ul className="python-case-results">{programFeedback[question.id].map((item) => <li key={item.test.name} className={item.passed ? "is-correct" : "is-incorrect"}><strong>{item.passed ? "✓" : "×"} {item.test.name}</strong><span>Input: {item.test.input.length ? item.test.input.join(", ") : "none"}</span><span>Expected: {item.test.expected}</span><span>Your output: {item.error ? item.error : item.output.trim() || "(no output)"}</span></li>)}</ul><button type="button" className="button-quiet" onClick={() => setShowSolution(!showSolution)}>{showSolution ? "Hide one solution" : "See one solution"}</button>{showSolution && <pre><code>{question.answer.ideal}</code></pre>}</div>}
      {submitted && !written && <div className={`python-exam-feedback ${correct(question, value) ? "is-correct" : "is-incorrect"}`} role="status"><h3>{correct(question, value) ? "Correct" : "Check this one again"}</h3><p><strong>Answer:</strong> {expected(question)}</p><p>{question.explanation}</p></div>}
      <div className="python-lesson-actions"><button type="button" disabled={running || position === 0} onClick={() => go(-1)}>← Previous</button><button type="button" disabled={running || position === visible.length - 1} onClick={() => go(1)}>Next question →</button></div></article>}
    <section className="python-next"><h2>Want a refresher?</h2><p>Review the three forms of conditional statements, then return to these programs.</p><Link className="button" href="/study/python">Learn Conditional Statements →</Link></section>
  </>}</main>;
}
