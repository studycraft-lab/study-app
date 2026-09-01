import { describe, expect, it } from "vitest";

import { reviewSchedule } from "./schedule";

describe("reviewSchedule", () => {
  const now = new Date("2026-09-01T00:00:00Z");

  it("returns incorrect answers tomorrow", () => {
    expect(reviewSchedule({ correct: false, now })).toMatchObject({ intervalDays: 1, reason: "incorrect" });
  });

  it("expands a successful review interval", () => {
    expect(reviewSchedule({ correct: true, repetitions: 2, now })).toMatchObject({ intervalDays: 14, repetitions: 3, reason: "maintenance" });
  });
});
