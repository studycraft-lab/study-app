import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("score appeal database contract", () => {
  const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/20260906030000_create_score_appeals.sql"), "utf8");

  it("preserves the automated grade and stores a separate audited adjustment", () => {
    expect(sql).toMatch(/original_earned_marks\s+numeric\s+not null/i);
    expect(sql).toMatch(/adjusted_earned_marks\s*=\s*p_earned_marks/i);
    expect(sql).not.toMatch(/set\s+earned_marks\s*=\s*p_earned_marks/i);
  });

  it("scopes resolution to the parent's family and validates the mark range", () => {
    expect(sql).toMatch(/family_id\s*=\s*p_family_id/i);
    expect(sql).toMatch(/p_earned_marks\s*>\s*v_attempt\.max_marks/i);
  });
});
