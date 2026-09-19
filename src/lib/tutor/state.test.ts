import { describe, expect, it } from "vitest";
import shapes from "../../../examples/lesson-packs/synthetic-shapes.json";
import plastids from "../../../examples/lesson-packs/plastids-unverified.json";
import { validateLessonPack } from "./validate";
import { applyTutorCommand, initialTutorState, type TutorCommand } from "./state";
import type { LessonPack } from "./types";
function fixture(input: unknown): LessonPack { const result = validateLessonPack(input); if (!result.valid) throw new Error(); return result.pack; }
function session(pack: LessonPack) {
  let state = initialTutorState(); let counter = 0;
  return { get state() { return state; }, send(input: Partial<TutorCommand> & Pick<TutorCommand, "name">) { const command = { revision: state.revision, stepId: pack.steps[state.stepIndex].id, callId: `call-${counter++}`, ...input }; state = applyTutorCommand(pack, state, command); return command; } };
}
describe("one deterministic formative tutoring state", () => {
  it.each([shapes, plastids])("finishes different packs in order with explicit continuation and capped stars", input => {
    const pack = fixture(input); const s = session(pack);
    for (const step of pack.steps) {
      expect(() => s.send({ name: "continue" })).toThrow();
      s.send({ name: "explained" }); s.send({ name: "ask_checkpoint" });
      expect(s.state.completed).not.toContain(step.checkpoint.id);
      s.send({ name: "record_checkpoint", answerKind: "choice", answer: step.checkpoint.options.find(o => o.id !== step.checkpoint.correctOptionId)!.id });
      expect(s.state.phase).toBe("retry"); expect(s.state.completed).not.toContain(step.checkpoint.id);
      s.send({ name: "retry" });
      const correct = s.send({ name: "record_checkpoint", answerKind: "choice", answer: step.checkpoint.correctOptionId });
      const before = s.state; expect(applyTutorCommand(pack, s.state, correct)).toBe(before);
      expect(s.state.phase).toBe("ready");
      s.send({ name: "show_step", target: step.id }); expect(s.state.phase).toBe("ready");
      s.send({ name: "continue" });
    }
    expect(s.state.phase).toBe("recap"); s.send({ name: "finish_lesson" });
    expect(s.state.phase).toBe("completed"); expect(s.state.completed).toHaveLength(pack.steps.length);
  });
  it("rejects skips, fabricated correctness, unknown IDs and stale revisions", () => {
    const pack = fixture(plastids); const s = session(pack);
    expect(() => s.send({ name: "show_step", target: pack.steps[1].id })).toThrow();
    expect(() => s.send({ name: "highlight", target: "absent" })).toThrow();
    expect(() => s.send({ name: "finish_lesson" })).toThrow();
    expect(() => applyTutorCommand(pack, s.state, { name: "record_checkpoint", correct: true })).toThrow();
    s.send({ name: "explained" });
    expect(() => s.send({ name: "ask_checkpoint", revision: 0 })).toThrow("changed");
  });
  it("supports only prepared clarifications and preserves the phase", () => {
    const pack = fixture(shapes); pack.clarifications = [{ id: "equal", question: "What does equal mean?", answer: "The same length.", factIds: [pack.facts[0].id] }];
    const s = session(pack); s.send({ name: "explained" }); s.send({ name: "clarify", target: "equal" });
    expect(s.state.phase).toBe("understanding"); expect(s.state.clarificationId).toBe("equal"); expect(s.state.completed).toEqual([]);
    expect(() => s.send({ name: "clarify", target: "unrelated" })).toThrow();
  });
  it("resumes at the current explanation boundary and retains earned checkpoints", () => {
    const pack = fixture(shapes); const s = session(pack);
    s.send({ name: "explained" }); s.send({ name: "ask_checkpoint" }); s.send({ name: "resume" }); expect(s.state.phase).toBe("explain");
    s.send({ name: "explained" }); s.send({ name: "ask_checkpoint" });
    s.send({ name: "record_checkpoint", answerKind: "text", answer: " FOUR! " }); s.send({ name: "resume" });
    expect(s.state.phase).toBe("ready"); expect(s.state.completed).toHaveLength(1); expect(Object.values(s.state.assessed)).toEqual(["accepted-text"]);
  });
  it("restarts a completed lesson and rejects commands from before the restart", () => {
    const pack = fixture(shapes); const s = session(pack);
    s.send({ name: "explained" }); s.send({ name: "ask_checkpoint" });
    s.send({ name: "record_checkpoint", answerKind: "choice", answer: pack.steps[0].checkpoint.correctOptionId });
    s.send({ name: "continue" }); s.send({ name: "finish_lesson" });
    const oldRevision = s.state.revision;
    const restart = s.send({ name: "restart" });
    expect(s.state).toEqual({ ...initialTutorState(), revision: oldRevision + 1, callIds: [restart.callId] });
    expect(applyTutorCommand(pack, s.state, restart)).toBe(s.state);
    expect(() => s.send({ name: "explained", revision: oldRevision })).toThrow("changed");
    s.send({ name: "explained" });
    expect(s.state.phase).toBe("understanding");
  });
});
