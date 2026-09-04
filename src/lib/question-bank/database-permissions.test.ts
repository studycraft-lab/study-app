import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("question-bank database permissions", () => {
  it("allows the server-side service role to delete a question-bank version", () => {
    const migrationDirectory = resolve(process.cwd(), "supabase/migrations");
    const migrationSql = readdirSync(migrationDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => readFileSync(resolve(migrationDirectory, file), "utf8"))
      .join("\n");

    expect(migrationSql).toMatch(/grant\s+delete\s+on\s+(?:table\s+)?public\.question_banks\s+to\s+service_role/i);
  });
});
