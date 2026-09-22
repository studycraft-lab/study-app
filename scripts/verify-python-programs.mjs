import { loadPyodide } from "pyodide";
import { readFile } from "node:fs/promises";
const bank = JSON.parse(await readFile(new URL("../ingestion-artifacts/python-conditional-statements-question-bank.json", import.meta.url), "utf8"));
import { PROGRAM_TESTS, evaluateProgramCase } from "../src/lib/python/program-tests.ts";
import { EXTRA_PROGRAMS } from "../src/lib/python/extra-programs.ts";

const pyodide = await loadPyodide();
let checked = 0;
const failures = [];
for (const question of [...bank.questions, ...EXTRA_PROGRAMS].filter((item) => item.response.editor === "python")) {
  const cases = PROGRAM_TESTS[question.id];
  if (!cases?.length) { failures.push(`${question.id}: no test cases`); continue; }
  for (const test of cases) {
    let output = "";
    let error = "";
    pyodide.setStdout({ batched: (line) => { output += line; } });
    pyodide.setStderr({ batched: () => {} });
    const globals = pyodide.globals.get("dict")();
    try {
      if (test.kind === "syntax") {
        globals.set("student_code", question.answer.ideal);
        await pyodide.runPythonAsync('import ast\n_tree=ast.parse(student_code)\nif not any(isinstance(n,ast.If) and n.orelse for n in ast.walk(_tree)): raise ValueError("Missing else")', { globals });
      } else {
        await pyodide.runPythonAsync(`import builtins\n__study_inputs=iter(${JSON.stringify(test.input)})\nbuiltins.input=lambda prompt="": next(__study_inputs)\n` + question.answer.ideal, { globals });
      }
    } catch (cause) { error = String(cause); }
    finally { globals.destroy(); }
    checked++;
    if (!evaluateProgramCase(test, { output, error })) failures.push(`${question.id} ${test.name}: ${error || JSON.stringify(output)}`);
  }
}
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log(`Verified ${checked} Python runs across ${Object.keys(PROGRAM_TESTS).length} program questions.`);
