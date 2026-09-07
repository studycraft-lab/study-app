import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("pending grading cleanup migration", () => {
  it("removes only legacy system-created pending appeals", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260907010000_separate_pending_grades_from_appeals.sql"), "utf8");
    expect(sql).toContain("where status = 'pending'");
    expect(sql).toContain("child_comment = 'Automated grading was unavailable.'");
    expect(sql).not.toMatch(/truncate/i);
  });
});
