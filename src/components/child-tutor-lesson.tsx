"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TutorPlayer } from "./tutor-player";
import { AppHeader } from "./app-header";
import type { LessonPack } from "@/lib/tutor/types";
import type { ProgressRow } from "@/lib/tutor/progress-store";
import type { TutorCommand } from "@/lib/tutor/state";
import type { SectionAnswer } from "@/lib/tutor/section-question";
const endpoint = "/api/study/tutor/progress";
type Session = { pack: LessonPack; progress: ProgressRow };
async function result(response: Response): Promise<Session> {
  const value = await response.json(); if (!response.ok) throw new Error(value.error); return value;
}
export function ChildTutorLesson() {
  const params = useSearchParams(); const packId = params.get("pack"); const savedId = params.get("resume");
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState(""); const [generation, setGeneration] = useState(0);
  const load = useCallback(async () => {
    const resumed = await result(await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(savedId ? { resumeId: savedId } : { packId }) }));
    setError(""); setSession(resumed); setGeneration(g => g + 1);
  }, [packId, savedId]);
  useEffect(() => { void Promise.resolve().then(load).catch(e => setError(e.message)); }, [load]);
  return <main className="study-shell tutor-lesson"><AppHeader role="child" /><Link className="tutor-back" href="/study/tutor/library">← All lessons</Link>{error && <p role="alert">{error}</p>}{session ? <><TutorPlayer key={generation} pack={session.pack} progressId={session.progress.id} initialState={session.progress.state} onReload={() => void load().catch(e => setError(e.message))} onAskQuestion={async (question: string) => {
    const response = await fetch("/api/study/tutor/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ progressId: session.progress.id, question }) });
    const value = await response.json(); if (!response.ok) throw new Error(value.error ?? "Could not answer your question."); return value as SectionAnswer;
  }} onCommand={async (command: TutorCommand) => {
    const updated = await result(await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: session.progress.id, command }) }));
    return updated.progress.state;
  }} /></> : !error && <p>Opening your saved lesson…</p>}</main>;
}
