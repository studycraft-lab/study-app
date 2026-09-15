/** Owned by the server process; no browser heartbeat or timer is needed. */
export class VoiceDeadlines {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  schedule(id: string, deadline: number, terminate: () => Promise<void>, failed: () => void) {
    this.cancel(id);
    this.timers.set(id, setTimeout(() => { this.timers.delete(id); void terminate().catch(failed); },Math.max(0,deadline-Date.now())));
  }
  cancel(id: string) { const timer = this.timers.get(id); if (timer) clearTimeout(timer); this.timers.delete(id); }
  clear() { for (const id of this.timers.keys()) this.cancel(id); }
}
