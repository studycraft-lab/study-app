import { afterEach, expect, it, vi } from "vitest";
import { VoiceDeadlines } from "./deadlines";
afterEach(() => vi.useRealTimers());
it("terminates at the server deadline without a browser heartbeat", async () => {
  vi.useFakeTimers(); const terminate = vi.fn().mockResolvedValue(undefined); const deadlines = new VoiceDeadlines();
  deadlines.schedule("call",Date.now()+600000,terminate,vi.fn());
  await vi.advanceTimersByTimeAsync(599999); expect(terminate).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); expect(terminate).toHaveBeenCalledTimes(1);
});
it("reports hangup failure for durable reconciliation instead of claiming closure", async () => {
  vi.useFakeTimers(); const failed = vi.fn(); const deadlines = new VoiceDeadlines();
  deadlines.schedule("call",Date.now(),vi.fn().mockRejectedValue(new Error()),failed); await vi.advanceTimersByTimeAsync(1); expect(failed).toHaveBeenCalledOnce();
});
