import type { LessonPack } from "./types";
export type Phase = "explain" | "understanding" | "checkpoint" | "retry" | "ready" | "recap" | "completed";
export type TutorState = { stepIndex: number; phase: Phase; completed: string[]; assessed: Record<string, "choice" | "accepted-text" | "model">; revision: number; callIds: string[]; clarificationId: string | null; focusId: string | null };
export type TutorCommand = { callId: string; revision: number; stepId: string; name: "explained" | "show_section" | "show_step" | "highlight" | "clarify" | "ask_checkpoint" | "record_checkpoint" | "retry" | "continue" | "finish_lesson" | "resume"; target?: string; answer?: string; answerKind?: "choice" | "text" };
export class TransitionError extends Error {}
export const initialTutorState = (): TutorState => ({ stepIndex: 0, phase: "explain", completed: [], assessed: {}, revision: 0, callIds: [], clarificationId: null, focusId: null });
export function parseTutorCommand(value: unknown): TutorCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TransitionError("Invalid tutor command.");
  const c = value as Record<string, unknown>;
  if (Object.keys(c).some(k => !["callId", "revision", "stepId", "name", "target", "answer", "answerKind"].includes(k)) || typeof c.callId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(c.callId) || !Number.isSafeInteger(c.revision) || Number(c.revision) < 0 || typeof c.stepId !== "string" || c.stepId.length > 64 || !["explained", "show_section", "show_step", "highlight", "clarify", "ask_checkpoint", "record_checkpoint", "retry", "continue", "finish_lesson", "resume"].includes(String(c.name))) throw new TransitionError("Invalid tutor command.");
  const targeted = ["show_section", "show_step", "highlight", "clarify"].includes(String(c.name));
  if (targeted ? typeof c.target !== "string" || c.target.length > 64 : c.target !== undefined) throw new TransitionError("Invalid command target.");
  if (c.name === "record_checkpoint") {
    if (typeof c.answer !== "string" || !c.answer.trim() || c.answer.length > 500 || !["choice", "text"].includes(String(c.answerKind))) throw new TransitionError("Choose or type a short answer.");
  } else if (c.answer !== undefined || c.answerKind !== undefined) throw new TransitionError("Unexpected answer.");
  return c as TutorCommand;
}
const normalise = (text: string) => text.normalize("NFKC").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function applyTutorCommand(pack: LessonPack, state: TutorState, untrusted: unknown): TutorState {
  const command = parseTutorCommand(untrusted);
  if (state.callIds.includes(command.callId)) return state;
  const step = pack.steps[state.stepIndex];
  if (!step || command.revision !== state.revision || command.stepId !== step.id) throw new TransitionError("The lesson has changed. Resume the current step.");
  const next: TutorState = { ...state, completed: [...state.completed], assessed: { ...state.assessed }, callIds: [...state.callIds.slice(-63), command.callId], revision: state.revision + 1, clarificationId: null };
  const requirePhase = (...phases: Phase[]) => { if (!phases.includes(state.phase)) throw new TransitionError("Finish the current question before continuing."); };
  switch (command.name) {
    case "explained": requirePhase("explain"); next.phase = "understanding"; break;
    case "show_section":
      if (command.target !== pack.section.id) throw new TransitionError("Stay within this textbook section.");
      requirePhase("explain", "understanding", "checkpoint", "retry", "ready"); break;
    case "show_step":
      if (command.target !== step.id) throw new TransitionError("Only the current teaching step can be shown.");
      requirePhase("explain", "understanding", "checkpoint", "retry", "ready");
      next.phase = state.completed.includes(step.checkpoint.id) ? "ready" : "explain"; break;
    case "highlight":
      requirePhase("explain", "understanding", "checkpoint", "retry", "ready");
      if (!pack.scenes.find(s => s.id === step.sceneId)?.elements.some(e => e.id === command.target)) throw new TransitionError("Unknown diagram element.");
      next.focusId = command.target!; break;
    case "clarify":
      requirePhase("explain", "understanding", "checkpoint", "retry", "ready");
      if (!pack.clarifications.some(c => c.id === command.target && c.factIds.every(id => step.factIds.includes(id)))) throw new TransitionError("That clarification is not prepared for this step.");
      next.clarificationId = command.target!; break;
    case "ask_checkpoint": requirePhase("understanding"); next.phase = "checkpoint"; break;
    case "record_checkpoint": {
      requirePhase("checkpoint");
      const correct = command.answerKind === "choice" ? command.answer === step.checkpoint.correctOptionId : step.checkpoint.acceptedAnswers.some(answer => normalise(answer) === normalise(command.answer!));
      if (command.answerKind === "choice" && !step.checkpoint.options.some(o => o.id === command.answer)) throw new TransitionError("Unknown answer choice.");
      if (correct) {
        if (!next.completed.includes(step.checkpoint.id)) next.completed.push(step.checkpoint.id);
        next.assessed[step.checkpoint.id] = command.answerKind === "choice" ? "choice" : "accepted-text";
        next.phase = "ready";
      } else next.phase = "retry";
      break;
    }
    case "retry": requirePhase("retry"); next.phase = "checkpoint"; break;
    case "continue":
      requirePhase("ready");
      if (!state.completed.includes(step.checkpoint.id)) throw new TransitionError("Answer the checkpoint first.");
      next.focusId = null;
      if (state.stepIndex === pack.steps.length - 1) next.phase = "recap";
      else { next.stepIndex += 1; next.phase = "explain"; }
      break;
    case "finish_lesson":
      requirePhase("recap");
      if (!pack.steps.every(s => state.completed.includes(s.checkpoint.id))) throw new TransitionError("Complete the checkpoints first.");
      next.phase = "completed"; break;
    case "resume":
      next.focusId = null;
      next.phase = ["recap", "completed"].includes(state.phase) ? state.phase : state.completed.includes(step.checkpoint.id) ? "ready" : "explain";
      break;
  }
  return next;
}
