"use client";
import { useState } from "react";
import { applyTutorCommand, initialTutorState, type TutorCommand, type TutorState } from "@/lib/tutor/state";
import type { LessonPack } from "@/lib/tutor/types";
import { TutorBoard } from "./tutor-board";

type Input = Pick<TutorCommand, "name" | "target" | "answer" | "answerKind">;
export function TutorPlayer({ pack, initialState, onCommand, onReload }: { pack: LessonPack; initialState?: TutorState; onCommand?: (command: TutorCommand) => Promise<TutorState>; onReload?: () => void }) {
  const [state, setState] = useState(initialState ?? initialTutorState);
  const [paused, setPaused] = useState(false);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const step = pack.steps[state.stepIndex];
  const recap = state.phase === "recap" || state.phase === "completed";
  const scene = pack.scenes.find(s => s.id === (recap ? pack.recap.sceneId : step.sceneId))!;
  const clarification = pack.clarifications.find(c => c.id === state.clarificationId);
  const caption = recap ? pack.recap.text : clarification?.answer ?? (state.phase === "retry" ? `Let's try again. ${step.checkpoint.hint}` : state.phase === "ready" ? step.checkpoint.encouragement : step.narration);
  async function send(input: Input) {
    if (busy || paused) return;
    setBusy(true); setError("");
    const command: TutorCommand = { ...input, callId: crypto.randomUUID(), revision: state.revision, stepId: step.id };
    try { setState(onCommand ? await onCommand(command) : applyTutorCommand(pack, state, command)); setAnswer(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save progress."); }
    finally { setBusy(false); }
  }
  return <section className="tutor-player" aria-label="Tutoring player"><h2>{pack.section.heading}</h2>
    <p>Scripted rehearsal · No live AI or microphone. Choose prepared explanations or answer checks below.</p>
    <p role="status">{paused ? "Paused" : busy ? "Saving" : recap ? "Recap" : "Ready to read"} · {state.completed.length} / {pack.steps.length} tutoring stars</p>
    <p>These checks are formative practice, separate from exercise marks.</p>
    {error && <p role="alert">{error} {onReload && <button onClick={onReload}>Resume saved lesson</button>}</p>}
    <div className="tutor-layout"><TutorBoard key={`${step.id}-${state.phase}`} scene={scene} actions={recap ? [] : step.actions} focusId={state.focusId} paused={paused} />
      <div><p aria-label="Tutor caption" aria-live="polite">{caption}</p>
        {state.phase === "explain" && <p>{step.simplerExplanation}</p>}
        <button onClick={() => setPaused(p => !p)}>{paused ? "Resume" : "Pause"}</button>
        <fieldset disabled={busy || paused}><legend>Lesson controls</legend>
          {!recap && <button onClick={() => void send({ name: "show_step", target: step.id })}>Explain again</button>}
          {state.phase === "explain" && <button onClick={() => void send({ name: "explained" })}>I have read the explanation</button>}
          {state.phase === "understanding" && <button onClick={() => void send({ name: "ask_checkpoint" })}>I understand — ask me a question</button>}
          {!recap && pack.clarifications.filter(c => c.factIds.every(id => step.factIds.includes(id))).map(c => <button key={c.id} onClick={() => void send({ name: "clarify", target: c.id })}>{c.question}</button>)}
          {state.phase === "checkpoint" && <div><h3>{step.checkpoint.prompt}</h3>{step.checkpoint.options.map(option => <button key={option.id} onClick={() => void send({ name: "record_checkpoint", answerKind: "choice", answer: option.id })}>{option.text}</button>)}<form onSubmit={e => { e.preventDefault(); void send({ name: "record_checkpoint", answerKind: "text", answer }); }}><label>Your answer <input value={answer} onChange={e => setAnswer(e.target.value)} maxLength={500} /></label><button disabled={!answer.trim()}>Check answer</button><p>Rehearsal checks prepared answer variants. If your wording is not recognised, try a choice.</p></form></div>}
          {state.phase === "retry" && <button onClick={() => void send({ name: "retry" })}>Try again</button>}
          {state.phase === "ready" && <button onClick={() => void send({ name: "continue" })}>{state.stepIndex === pack.steps.length - 1 ? "See recap" : "Continue to next step"}</button>}
          {state.phase === "recap" && <button onClick={() => void send({ name: "finish_lesson" })}>Finish lesson</button>}
          {state.phase === "completed" && <p>Lesson complete. You can return to practice whenever you are ready.</p>}
        </fieldset>
      </div></div>
  </section>;
}
