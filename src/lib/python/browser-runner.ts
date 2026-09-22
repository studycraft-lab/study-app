import type { ProgramCase, ProgramResult } from "./program-tests";

export async function runPythonCases(code: string, cases: ProgramCase[]): Promise<ProgramResult[]> {
  if (code.length > 10000) throw new Error("Please keep your program under 10,000 characters.");
  if (typeof Worker === "undefined") throw new Error("This browser cannot run Python. Try an updated browser.");
  return new Promise((resolve, reject) => {
    const worker = new Worker("/python-runner.mjs", { type: "module" });
    let finished = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (error?: Error, results?: ProgramResult[]) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker.terminate();
      if (error) reject(error);
      else resolve(results ?? []);
    };
    timer = setTimeout(() => finish(new Error("Python took too long to load. Check your connection and try again.")), 45000);
    worker.onerror = () => finish(new Error("Python could not start in this browser. Please try again."));
    worker.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "ready") {
        clearTimeout(timer);
        timer = setTimeout(() => finish(new Error("Your program ran for too long. Check for an endless loop.")), 8000);
        worker.postMessage({ type: "run", code, cases: cases.map(({ input, kind }) => ({ input, kind })) });
      } else if (data?.type === "init-error" || data?.type === "error") finish(new Error(String(data.error ?? "Python could not start.")));
      else if (data?.type === "results") finish(undefined, data.results);
    };
  });
}
