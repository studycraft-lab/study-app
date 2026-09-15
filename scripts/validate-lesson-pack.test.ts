// Reuses the production semantic validator through Vitest's TypeScript loader.
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { validateLessonPack } from "../src/lib/tutor/validate";
it.skipIf(!process.env.LESSON_PACK_PATH)("validates the requested lesson pack", () => {
  const result = validateLessonPack(JSON.parse(readFileSync(process.env.LESSON_PACK_PATH!, "utf8")));
  expect(result.errors, result.errors.join("\n")).toEqual([]);
});
