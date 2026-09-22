import { loadPyodide } from "./pyodide/pyodide.mjs";

const runtimePromise = loadPyodide({
  indexURL: new URL("./pyodide/", import.meta.url).href,
  stdout: () => {},
  stderr: () => {},
});
runtimePromise.then(() => self.postMessage({ type: "ready" }), (error) => self.postMessage({ type: "init-error", error: String(error?.message ?? error) }));

self.onmessage = async ({ data }) => {
  if (data?.type !== "run" || typeof data.code !== "string" || !Array.isArray(data.cases)) return;
  let pyodide;
  try { pyodide = await runtimePromise; }
  catch (error) { self.postMessage({ type: "error", error: String(error?.message ?? error) }); return; }
  const results = [];
  for (const test of data.cases) {
    const output = [];
    const errors = [];
    pyodide.setStdout({ batched: (line) => { if (output.join("").length < 4000) output.push(line.endsWith("\n") ? line : line + "\n"); } });
    pyodide.setStderr({ batched: (line) => { if (errors.join("").length < 2000) errors.push(line.endsWith("\n") ? line : line + "\n"); } });
    const globals = pyodide.globals.get("dict")();
    try {
      if (test.kind === "syntax") {
        globals.set("student_code", data.code);
        await pyodide.runPythonAsync(`import ast
_tree = ast.parse(student_code)
if not any(isinstance(_node, ast.If) and _node.orelse for _node in ast.walk(_tree)):
    raise ValueError("Include both an if branch and an else branch.")`, { globals, filename: "student.py" });
      } else {
        const inputs = test.input.map(String);
        const prelude = `import builtins\n__study_inputs = iter(${JSON.stringify(inputs)})\nbuiltins.input = lambda prompt="": next(__study_inputs)\n`;
        await pyodide.runPythonAsync(prelude + data.code, { globals, filename: "student.py" });
      }
      results.push({ output: output.join(""), error: errors.join("") });
    } catch (error) {
      results.push({ output: output.join(""), error: String(error?.message ?? error).slice(-2000) });
    } finally { globals.destroy(); }
  }
  self.postMessage({ type: "results", results });
};
