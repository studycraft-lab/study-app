import { parseTutorCommand, type TutorCommand, type TutorState } from "../state";
/** Protocol bridge. A trusted controller must authenticate events before persisted effects. */
export class TutorVoiceEvents {
  private epoch = 0;
  private responses = new Map<string, { epoch: number; revision: number; stepId: string }>();
  private completed = new Set<string>();
  constructor(private current: () => { state: TutorState; stepId: string }, private apply: (command: TutorCommand) => Promise<unknown>, private send: (event: unknown) => void, private beforeContinuation: (effect: unknown) => Promise<void> = async () => {}) {}
  interrupt() { this.epoch += 1; this.responses.clear(); this.send({ type: "response.cancel" }); this.send({ type: "output_audio_buffer.clear" }); }
  async receive(event: unknown) {
    if (!event || typeof event !== "object") return;
    const data = event as Record<string, unknown>;
    if (data.type === "input_audio_buffer.speech_started") { this.interrupt(); return; }
    if (data.type === "response.created") {
      const response = data.response as { id?: unknown } | undefined;
      if (typeof response?.id === "string") {
        const current = this.current();
        if (this.responses.size >= 64) this.responses.clear();
        this.responses.set(response.id, { epoch: this.epoch, revision: current.state.revision, stepId: current.stepId });
      }
      return;
    }
    if (data.type !== "response.done") return;
    const response = data.response as { id?: string; status?: string; output?: { type?: string; status?: string; name?: string; call_id?: string; arguments?: string }[] } | undefined;
    if (!response?.id) return;
    const context = this.responses.get(response.id); this.responses.delete(response.id);
    if (!context || response.status !== "completed" || context.epoch !== this.epoch || !Array.isArray(response.output)) return;
    if (response.output.length > 8) return;
    for (const call of response.output) {
      if (call.type !== "function_call" || call.status !== "completed" || call.name !== "tutor_command" || !call.call_id || this.completed.has(call.call_id) || typeof call.arguments !== "string" || call.arguments.length > 2048) continue;
      const current = this.current();
      if (context.epoch !== this.epoch || current.stepId !== context.stepId || current.state.revision !== context.revision) return;
      this.completed.add(call.call_id);
      if (this.completed.size > 256) this.completed.delete(this.completed.values().next().value!);
      let acknowledged = false;
      try {
        const args = JSON.parse(call.arguments);
        const command = parseTutorCommand({ ...args, callId: call.call_id, revision: context.revision, stepId: context.stepId });
        const effect = await this.apply(command);
        if (context.epoch !== this.epoch) return;
        this.send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify({ applied: true, effect }) } });
        acknowledged = true;
        await this.beforeContinuation(effect);
        if (context.epoch === this.epoch) this.send({ type: "response.create" });
      } catch {
        if (!acknowledged && context.epoch === this.epoch) this.send({ type: "conversation.item.create", item: { type: "function_call_output", call_id: call.call_id, output: JSON.stringify({ applied: false, error: "Action is not legal for the current lesson phase." }) } });
      }
      return;
    }
  }
}
