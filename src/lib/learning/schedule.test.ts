import { describe, expect, it } from "vitest";

import { reviewSchedule } from "./schedule";

describe("reviewSchedule", () => {
  const now = new Date("2026-09-01T00:00:00Z");

  it("returns incorrect and correct thumbs-down answers tomorrow", () => {
    expect(reviewSchedule({ correct: false, rating: "up", now })).toMatchObject({ intervalDays: 1, reason: "incorrect" });
    expect(reviewSchedule({ correct: true, rating: "down", now })).toMatchObject({ intervalDays: 1, reason: "low_confidence" });
  });

  it("expands a successful review interval", () => {
    expect(reviewSchedule({ correct: true, rating: "up", repetitions: 2, now })).toMatchObject({ intervalDays: 14, repetitions: 3, reason: "maintenance" });
  });
});
