import { expect, it, vi } from "vitest";
import { TutorVoiceEvents } from "./events";
import { initialTutorState } from "../state";
const done = (status = "completed") => ({ type: "response.done",response: { id: "response-one",status,output: [{ type: "function_call",status: "completed",name: "tutor_command",call_id: "call-one",arguments: JSON.stringify({ name: "explained" }) }] } });
it("applies before acknowledgement/continuation and ignores duplicate results", async () => {
  const order: string[] = []; const state = initialTutorState();
  const apply = vi.fn(async () => { order.push("apply"); state.revision++; });
  const bridge = new TutorVoiceEvents(() => ({ state,stepId: "step" }),apply,e => order.push((e as { type: string }).type));
  await bridge.receive({ type: "response.created",response: { id: "response-one" } }); await bridge.receive(done()); await bridge.receive(done());
  expect(order).toEqual(["apply","conversation.item.create","response.create"]); expect(apply).toHaveBeenCalledTimes(1);
});
it.each(["cancelled","failed","incomplete"])("does not apply %s calls", async status => {
  const apply = vi.fn(); const bridge = new TutorVoiceEvents(() => ({ state: initialTutorState(),stepId: "step" }),apply,vi.fn());
  await bridge.receive({ type: "response.created",response: { id: "response-one" } }); await bridge.receive(done(status)); expect(apply).not.toHaveBeenCalled();
});
it("interrupts speech and rejects stale responses and changed revisions", async () => {
  const state = initialTutorState(); const apply = vi.fn(); const send = vi.fn(); const bridge = new TutorVoiceEvents(() => ({ state,stepId: "step" }),apply,send);
  await bridge.receive({ type: "response.created",response: { id: "response-one" } }); bridge.interrupt(); await bridge.receive(done());
  expect(send).toHaveBeenCalledWith({ type: "response.cancel" }); expect(send).toHaveBeenCalledWith({ type: "output_audio_buffer.clear" });
  await bridge.receive({ type: "response.created",response: { id: "response-one" } }); state.revision++; await bridge.receive(done()); expect(apply).not.toHaveBeenCalled();
});
it("waits for board acknowledgement before continuing speech", async () => {
  let ready!: () => void; const acknowledged = new Promise<void>(resolve => { ready = resolve; }); const send = vi.fn();
  const bridge = new TutorVoiceEvents(() => ({ state: initialTutorState(),stepId: "step" }),async () => ({ revision: 1 }),send,() => acknowledged);
  await bridge.receive({ type: "response.created",response: { id: "response-one" } }); const pending = bridge.receive(done()); await Promise.resolve();
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: "conversation.item.create" })); expect(send).not.toHaveBeenCalledWith({ type: "response.create" });
  ready(); await pending; expect(send).toHaveBeenCalledWith({ type: "response.create" });
});
