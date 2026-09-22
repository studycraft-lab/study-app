"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "./app-header";

type Lesson = { title: string; idea: string; code: string; notes: string[]; check: { question: string; choices: string[]; correct: number; why: string } };
const lessons: Lesson[] = [
  { title: "Refresh your Python basics", idea: "Variables store values. input() gives text, so convert it with int() when you need whole-number arithmetic. Use == to compare; = assigns a value.", code: 'marks = int(input("Marks: "))\nprint(marks + 2)', notes: ["Valid names include total_marks and _count. Names cannot start with a digit or contain #; elif is a keyword.", "int stores whole numbers, float stores decimals, str stores text, and bool stores True or False.", "/ gives a decimal result, // floor division, % the remainder, ** a power."], check: { question: "What type does input() give before int() converts it?", choices: ["int", "str", "bool"], correct: 1, why: "input() returns text, which is a str." } },
  { title: "Simple if: one possible action", idea: "A simple if checks a condition. Its indented block runs only when the condition is True.", code: 'num = int(input("Enter a number: "))\nif num > 0:\n    print("The number is positive")', notes: ["End the if line with a colon.", "Indent the action under if. Four spaces are a clear habit.", "For zero or a negative number, this example prints nothing."], check: { question: "What happens to the print line when num is 0?", choices: ["It prints positive", "It is skipped", "It causes a syntax error"], correct: 1, why: "0 > 0 is False, so the indented line is skipped." } },
  { title: "if…else: choose one of two paths", idea: "Use else when exactly one of two outcomes should happen. % finds the remainder after division.", code: 'num = int(input("Enter a number: "))\nif num % 2 == 0:\n    print("Even number")\nelse:\n    print("Odd number")', notes: ["num % 2 == 0 means the number divides by 2 with no remainder.", "Only one of these two print lines runs.", "For a bill below ₹200, the delivery charge can be 30; else it can be 0."], check: { question: "What does the program print for num = 7?", choices: ["Even number", "Odd number", "Nothing"], correct: 1, why: "7 % 2 is 1, so the else branch runs." } },
  { title: "if…elif…else: several outcomes", idea: "Python checks from top to bottom and stops at the first True branch. Put the highest grade boundary first.", code: 'marks = int(input("Marks: "))\nif marks >= 90:\n    print("Grade A")\nelif marks >= 75:\n    print("Grade B")\nelif marks >= 40:\n    print("Grade C")\nelse:\n    print("Fail")', notes: ["82 meets >= 75, so it gets Grade B.", "90 also meets >= 75, but the >= 90 test comes first.", "Test boundary values such as 39, 40, 74, 75, 89 and 90."], check: { question: "What grade does marks = 75 receive?", choices: ["Grade A", "Grade B", "Grade C"], correct: 1, why: "75 is below 90 and meets the next condition, >= 75." } },
  { title: "Plan a full program", idea: "For longer exam programs, underline the inputs, calculations, decisions, and exact output. Trace an example before writing.", code: 'bill = int(input("Bill amount: "))\nif bill < 200:\n    delivery = 30\nelse:\n    delivery = 0\nprint("Final Amount:", bill + delivery)', notes: ["A bill of 180 pays 30 delivery; the final amount is 210.", "A bill of exactly 200 has free delivery. The boundary matters.", "Use meaningful variable names and print every requested value."], check: { question: "What is the final amount for a bill of ₹200?", choices: ["₹200", "₹230", "₹30"], correct: 0, why: "The charge applies only below 200, so delivery is 0." } },
];

export function PythonLearningModule() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lesson, setLesson] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  useEffect(() => {
    void fetch("/api/study/library", { cache: "no-store" }).then(async (result) => {
      if (result.status === 401) { router.replace("/login?role=child"); return; }
      if (!result.ok) { setLoadError("Could not open Python lessons. Please refresh the page."); return; }
      const body = await result.json();
      setName(body.child?.displayName ?? ""); setReady(true);
    }).catch(() => setLoadError("Could not open Python lessons. Please refresh the page."));
  }, [router]);
  const current = lessons[lesson];
  return <main className="study-shell python-learning-page"><AppHeader role="child" childName={name} />{!ready ? <p className="study-loading">{loadError || "Opening Python lessons…"}</p> : <>
    <section className="python-hero"><p className="eyebrow">Computer Studies</p><h1>Conditional Statements</h1></section>
    <section className="python-lesson" aria-labelledby="python-lesson-heading"><div className="python-section-heading"><div><p className="eyebrow">Lesson {lesson + 1} of {lessons.length}</p><h2 id="python-lesson-heading">{current.title}</h2></div></div><nav className="python-step-nav" aria-label="Python lessons">{lessons.map((item, index) => <button type="button" aria-current={lesson === index ? "step" : undefined} className={lesson === index ? "is-active" : ""} onClick={() => { setLesson(index); setChoice(null); }} key={item.title}>{index + 1}</button>)}</nav><p className="python-idea">{current.idea}</p><pre><code>{current.code}</code></pre><ul>{current.notes.map((note) => <li key={note}>{note}</li>)}</ul><div className="python-check"><strong>Quick check</strong><p>{current.check.question}</p><div>{current.check.choices.map((answer, index) => <button type="button" key={answer} className={choice === index ? "is-selected" : ""} onClick={() => setChoice(index)}>{answer}</button>)}</div>{choice !== null && <p role="status" className={choice === current.check.correct ? "is-correct" : "is-incorrect"}>{choice === current.check.correct ? "Correct. " : "Try again. "}{current.check.why}</p>}</div><div className="python-lesson-actions"><button type="button" disabled={lesson === 0} onClick={() => { setLesson(lesson - 1); setChoice(null); }}>← Previous</button><button type="button" disabled={lesson === lessons.length - 1} onClick={() => { setLesson(lesson + 1); setChoice(null); }}>Next lesson →</button></div></section>
    <section className="python-next"><h2>Python Programming</h2><Link className="button" href="/study/python/practice">Start practice →</Link></section>
  </>}</main>;
}
