"use client";
import { useState } from "react";
import { applyTutorCommand, initialTutorState, type TutorCommand, type TutorState } from "@/lib/tutor/state";
import type { LessonPack } from "@/lib/tutor/types";
import { TutorVoiceControls } from "./tutor-voice-controls";
import { TutorBoard } from "./tutor-board";

type Input = Pick<TutorCommand, "name" | "target" | "answer" | "answerKind">;
export function TutorPlayer({ pack, initialState, onCommand, onReload, progressId }: { progressId?: string; pack: LessonPack; initialState?: TutorState; onCommand?: (command: TutorCommand) => Promise<TutorState>; onReload?: () => void }) {
  const [state, setState] = useState(initialState ?? initialTutorState);
  const [voiceSend, setVoiceSend] = useState<((text: string) => void) | null>(null);
  const [voiceMotionPaused, setVoiceMotionPaused] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
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
    if (voiceSend) {
      const words = input.name === "record_checkpoint" ? `My answer is ${input.answerKind === "choice" ? step.checkpoint.options.find(o => o.id === input.answer)?.text : input.answer}` : input.name === "show_step" ? "Explain this step again." : input.name === "ask_checkpoint" ? "I understand. Ask me the checkpoint." : input.name === "continue" ? "I am ready. Continue to the next step." : input.name === "clarify" ? pack.clarifications.find(c => c.id === input.target)?.question ?? "Please explain again." : input.name === "finish_lesson" ? "I have read the recap. Finish the lesson." : input.name === "retry" ? "Let me try the question again." : "I have read the explanation.";
      voiceSend(words); return;
    }
    setBusy(true); setError("");
    const command: TutorCommand = { ...input, callId: crypto.randomUUID(), revision: state.revision, stepId: step.id };
    try { setState(onCommand ? await onCommand(command) : applyTutorCommand(pack, state, command)); setAnswer(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save progress."); }
    finally { setBusy(false); }
  }
  async function restart() {
    if (busy || voiceActive || !window.confirm("Restart this lesson? Your saved steps and tutoring stars will be cleared.")) return;
    setBusy(true); setError("");
    const command: TutorCommand = { name: "restart", callId: crypto.randomUUID(), revision: state.revision, stepId: step.id };
    try {
      setState(onCommand ? await onCommand(command) : applyTutorCommand(pack, state, command));
      setAnswer(""); setPaused(false); setVoiceMotionPaused(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not restart lesson."); }
    finally { setBusy(false); }
  }
  return <section className="tutor-player" aria-label="Tutoring player"><header className="tutor-player-heading"><p className="eyebrow">{pack.source.chapterTitle} · {recap ? "Recap" : `Step ${state.stepIndex + 1} of ${pack.steps.length}`}</p><h2>{pack.section.heading}</h2><button className="button-quiet" disabled={busy || voiceActive} title={voiceActive ? "End live voice before restarting" : undefined} onClick={() => void restart()}>Restart lesson</button></header>
    {!progressId && <p>Parent preview · No live AI or microphone.</p>}
    {progressId && <TutorVoiceControls progressId={progressId} paused={paused} onActivity={setVoiceMotionPaused} onActiveChange={setVoiceActive} onState={setState} onMode={send => setVoiceSend(() => send)} />}
    <p role="status">{paused ? "Paused" : busy ? "Saving" : recap ? "Recap" : "Ready to read"} · {state.completed.length} / {pack.steps.length} tutoring stars</p>
    <progress className="tutor-progress" value={state.completed.length} max={pack.steps.length} aria-label="Lesson progress" />
    {error && <p role="alert">{error} {onReload && <button onClick={onReload}>Resume saved lesson</button>}</p>}
    <div className="tutor-layout"><TutorBoard key={`${step.id}-${state.phase}`} scene={scene} actions={recap ? [] : step.actions} focusId={state.focusId} paused={paused || (!!voiceSend && voiceMotionPaused)} />
      <div><p aria-label="Tutor caption" aria-live="polite">{caption}</p>

        <button className="button-quiet" onClick={() => setPaused(p => !p)}>{paused ? "Resume" : "Pause"}</button>
        <fieldset disabled={busy || paused}><legend className="sr-only">Lesson controls</legend>

          {state.phase === "explain" && <button className="tutor-primary" onClick={() => void send({ name: "explained" })}>I have read the explanation</button>}
          {state.phase === "understanding" && <button className="tutor-primary" onClick={() => void send({ name: "ask_checkpoint" })}>I understand — ask me a question</button>}
          {!recap && <details className="tutor-help"><summary>Help me understand</summary><p>{step.simplerExplanation}</p><button className="tutor-primary" onClick={() => void send({ name: "show_step", target: step.id })}>Explain again</button>{pack.clarifications.filter(c => c.factIds.every(id => step.factIds.includes(id))).map(c => <button key={c.id} onClick={() => void send({ name: "clarify", target: c.id })}>{c.question}</button>)}</details>}
          {state.phase === "checkpoint" && <div><h3>{step.checkpoint.prompt}</h3>{step.checkpoint.options.map(option => <button key={option.id} onClick={() => void send({ name: "record_checkpoint", answerKind: "choice", answer: option.id })}>{option.text}</button>)}<details className="tutor-help"><summary>Type an answer instead</summary><form onSubmit={e => { e.preventDefault(); void send({ name: "record_checkpoint", answerKind: "text", answer }); }}><label>Your answer <input value={answer} onChange={e => setAnswer(e.target.value)} maxLength={500} /></label><button disabled={!answer.trim()}>Check answer</button><p>If your wording is not recognised, try one of the choices.</p></form></details></div>}
          {state.phase === "retry" && <button className="tutor-primary" onClick={() => void send({ name: "retry" })}>Try again</button>}
          {state.phase === "ready" && <button className="tutor-primary" onClick={() => void send({ name: "continue" })}>{state.stepIndex === pack.steps.length - 1 ? "See recap" : "Continue to next step"}</button>}
          {state.phase === "recap" && <button className="tutor-primary" onClick={() => void send({ name: "finish_lesson" })}>Finish lesson</button>}
          {state.phase === "completed" && <p>Lesson complete. You can return to practice whenever you are ready.</p>}
        </fieldset>
      </div></div>
  </section>;
}
