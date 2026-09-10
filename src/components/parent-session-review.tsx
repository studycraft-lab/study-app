"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "./app-header";

type Appeal = {
  id: string; childName: string; childComment?: string | null; subject: string; chapterTitle: string;
  question: string; childAnswer: unknown; expectedAnswer: unknown; explanation: unknown; rubric: unknown;
  originalEarnedMarks: number; maxMarks: number; sourcePages: number[]; gradingMeta?: { model?: string } | null;
};

function rubricPoints(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const points = (value as { points?: unknown }).points;
  return Array.isArray(points) ? points.flatMap((point) => point && typeof point === "object" && "concept" in point ? [String(point.concept)] : []) : [];
}

export function ParentSessionReview() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [awards, setAwards] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    const appealResponse = await fetch("/api/parent/score-appeals");
    const appealBody = await appealResponse.json();
    if (!appealResponse.ok) throw new Error(appealBody.error);
    setAppeals(appealBody.pending ?? []);
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

  return <main className="parent-shell"><AppHeader role="parent" /><section className="parent-intro"><Link href="/parent/family">← Back to children & progress</Link><p className="eyebrow">Parent review</p><h1>Score appeals</h1><p>Review scores disputed by a child and award final marks. Question-quality reports remain in the content library.</p></section>
    {error && <p className="notice notice-error">{error}</p>}
    {appeals.length > 0 && <section className="dashboard-section appeal-queue"><h2>Score appeals ({appeals.length})</h2>{appeals.map((appeal) => { const points = rubricPoints(appeal.rubric); return <article className="appeal-card" key={appeal.id}><header><div><strong>{appeal.childName}</strong><span>{appeal.subject} · {appeal.chapterTitle}</span></div><b>{appeal.originalEarnedMarks}/{appeal.maxMarks} automated marks</b></header><h3>{appeal.question}</h3><dl className="review-answers"><div><dt>Child answered</dt><dd>{typeof appeal.childAnswer === "string" ? appeal.childAnswer : JSON.stringify(appeal.childAnswer)}</dd></div><div><dt>Expected</dt><dd>{String(appeal.expectedAnswer ?? "See required points")}</dd></div></dl>{points.length > 0 && <div className="rubric-feedback"><strong>Required points</strong><ul>{points.map((point) => <li key={point}>{point}</li>)}</ul></div>}{appeal.explanation != null && <p>{String(appeal.explanation)}</p>}{appeal.childComment && <p><strong>Child’s note:</strong> {appeal.childComment}</p>}{appeal.sourcePages.length > 0 && <small className="source-cite">Textbook {appeal.sourcePages.map((page) => `Page ${page}`).join(", ")}</small>}{appeal.gradingMeta?.model && <small>Automated by {appeal.gradingMeta.model}</small>}<div className="appeal-resolution"><label>Final marks<input type="number" min="0" max={appeal.maxMarks} step="0.5" value={awards[appeal.id] ?? String(appeal.originalEarnedMarks)} onChange={(event) => setAwards((values) => ({ ...values, [appeal.id]: event.target.value }))} /></label><label>Parent note <span>(optional)</span><input value={comments[appeal.id] ?? ""} onChange={(event) => setComments((values) => ({ ...values, [appeal.id]: event.target.value }))} /></label><div className="button-row"><button disabled={busy} onClick={() => resolve(appeal, appeal.originalEarnedMarks)}>Confirm current score</button><button disabled={busy} onClick={() => resolve(appeal, Number(awards[appeal.id] ?? appeal.originalEarnedMarks))}>Save final marks</button></div></div></article>; })}</section>}
    {!error && !loaded && <p className="study-loading">Loading reviews…</p>}
    {!error && loaded && appeals.length === 0 && <p className="empty-state">No score appeals waiting.</p>}
  </main>;
}
