import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("node_modules/pyodide");
const destination = resolve("public/pyodide");
await mkdir(destination, { recursive: true });
for (const name of ["pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm", "pyodide-lock.json", "python_stdlib.zip"]) {
  await copyFile(resolve(source, name), resolve(destination, name));
}
