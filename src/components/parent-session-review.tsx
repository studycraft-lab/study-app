"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type Appeal = {
  id: string; childName: string; childComment?: string | null; subject: string; chapterTitle: string;
  question: string; childAnswer: unknown; expectedAnswer: unknown; explanation: unknown; rubric: unknown;
  originalEarnedMarks: number; maxMarks: number; sourcePages: number[]; gradingMeta?: { model?: string } | null;
};
type GrammarAppeal = { id: string; childName: string; lessonTitle: string; questionNumber: number; question: string; answer: string; expectedAnswer: string; originalStatus: string; childComment?: string | null };

function rubricPoints(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const points = (value as { points?: unknown }).points;
  return Array.isArray(points) ? points.flatMap((point) => point && typeof point === "object" && "concept" in point ? [String(point.concept)] : []) : [];
}

export function ParentSessionReview() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [grammarAppeals, setGrammarAppeals] = useState<GrammarAppeal[]>([]);
  const [awards, setAwards] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    const [appealResponse, grammarResponse] = await Promise.all([fetch("/api/parent/score-appeals"), fetch("/api/parent/grammar-appeals")]);
    const [appealBody, grammarBody] = await Promise.all([appealResponse.json(), grammarResponse.json()]);
    if (!appealResponse.ok || !grammarResponse.ok) throw new Error(appealBody.error ?? grammarBody.error ?? "Could not load appeals.");
    setAppeals(appealBody.pending ?? []); setGrammarAppeals(grammarBody.pending ?? []);
    setLoaded(true);
  }, []);
  useEffect(() => { void Promise.resolve().then(load).catch((cause) => setError(cause.message)); }, [load]);

  async function resolve(appeal: Appeal, earnedMarks: number) {
    setBusy(true); setError("");
    const response = await fetch("/api/parent/score-appeals", {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ appealId: appeal.id, earnedMarks, comment: comments[appeal.id] ?? "" }),
    });
    const body = await response.json();
    if (response.ok) await load(); else setError(body.error ?? "Could not resolve this appeal.");
    setBusy(false);
  }
  async function resolveGrammar(appeal: GrammarAppeal, correct: boolean) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/parent/grammar-appeals", { method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ appealId: appeal.id, correct, comment: comments[appeal.id] ?? "" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not resolve this appeal.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not resolve this appeal."); }
    finally { setBusy(false); }
  }

  return <main className="parent-shell"><AppHeader role="parent" /><section className="parent-intro"><Link href="/parent/family">← Back to children & progress</Link><p className="eyebrow">Parent review</p><h1>Score appeals</h1><p>Review disputed session and English Language grammar answers.</p></section>
    {error && <p className="notice notice-error">{error}</p>}
    {appeals.length > 0 && <section className="dashboard-section appeal-queue"><h2>Score appeals ({appeals.length})</h2>{appeals.map((appeal) => { const points = rubricPoints(appeal.rubric); return <article className="appeal-card" key={appeal.id}><header><div><strong>{appeal.childName}</strong><span>{appeal.subject} · {appeal.chapterTitle}</span></div><b>{appeal.originalEarnedMarks}/{appeal.maxMarks} automated marks</b></header><h3>{appeal.question}</h3><dl className="review-answers"><div><dt>Child answered</dt><dd>{typeof appeal.childAnswer === "string" ? appeal.childAnswer : JSON.stringify(appeal.childAnswer)}</dd></div><div><dt>Expected</dt><dd>{String(appeal.expectedAnswer ?? "See required points")}</dd></div></dl>{points.length > 0 && <div className="rubric-feedback"><strong>Required points</strong><ul>{points.map((point) => <li key={point}>{point}</li>)}</ul></div>}{appeal.explanation != null && <p>{String(appeal.explanation)}</p>}{appeal.childComment && <p><strong>Child’s note:</strong> {appeal.childComment}</p>}{appeal.sourcePages.length > 0 && <small className="source-cite">Textbook {appeal.sourcePages.map((page) => `Page ${page}`).join(", ")}</small>}{appeal.gradingMeta?.model && <small>Automated by {appeal.gradingMeta.model}</small>}<div className="appeal-resolution"><label>Final marks<input type="number" min="0" max={appeal.maxMarks} step="0.5" value={awards[appeal.id] ?? String(appeal.originalEarnedMarks)} onChange={(event) => setAwards((values) => ({ ...values, [appeal.id]: event.target.value }))} /></label><label>Parent note <span>(optional)</span><input value={comments[appeal.id] ?? ""} onChange={(event) => setComments((values) => ({ ...values, [appeal.id]: event.target.value }))} /></label><div className="button-row"><button disabled={busy} onClick={() => resolve(appeal, Number(awards[appeal.id] ?? appeal.originalEarnedMarks))}>Confirm final marks</button></div></div></article>; })}</section>}
    {grammarAppeals.length > 0 && <section className="dashboard-section appeal-queue"><h2>Grammar appeals ({grammarAppeals.length})</h2>{grammarAppeals.map((appeal) => <article className="appeal-card" key={appeal.id}><header><div><strong>{appeal.childName}</strong><span>English Language · {appeal.lessonTitle} · Question {appeal.questionNumber}</span></div><b>{appeal.originalStatus === "review" ? "Needs review" : "Marked incorrect"}</b></header><h3>{appeal.question}</h3><dl className="review-answers"><div><dt>Child answered</dt><dd>{appeal.answer}</dd></div><div><dt>Model answer</dt><dd>{appeal.expectedAnswer}</dd></div></dl>{appeal.childComment && <p><strong>Child’s note:</strong> {appeal.childComment}</p>}<div className="appeal-resolution"><label>Parent note <span>(optional)</span><input maxLength={1000} value={comments[appeal.id] ?? ""} onChange={(event) => setComments((values) => ({ ...values, [appeal.id]: event.target.value }))} /></label><div className="button-row"><button disabled={busy} onClick={() => void resolveGrammar(appeal, true)}>Accept answer · 1 mark</button><button className="button-secondary" disabled={busy} onClick={() => void resolveGrammar(appeal, false)}>Keep incorrect · 0 marks</button></div></div></article>)}</section>}
    {!error && !loaded && <p className="study-loading">Loading reviews…</p>}
    {!error && loaded && appeals.length === 0 && grammarAppeals.length === 0 && <p className="empty-state">No score appeals waiting.</p>}
  </main>;
}
