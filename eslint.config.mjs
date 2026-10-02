import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "public/pyodide/**",
    // Standalone video-render scripts are production artifacts, not app code.
    "proposals/**/render.cjs",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
