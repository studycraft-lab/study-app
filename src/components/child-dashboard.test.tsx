import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChildDashboard } from "./child-dashboard";

describe("ChildDashboard", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("shows compact motivation and previous scores without advanced learning metrics", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      summary: { completedSessions: 2, attempts: 8, accuracy: 75, mastery: 70, dueReview: 3, rewards: { points: 80, stars: 6, level: 2, streak: 4 } },
      sessions: [{ id: "session-1", status: "completed", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 5, attempts: [{ id: "attempt-1", question_prompt: "Question", correct: true, earned_marks: 4, max_marks: 5 }] }],
    })));

    render(<ChildDashboard />);

    expect(await screen.findByText("6")).toBeInTheDocument();
    expect(screen.getByText("Stars")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("sessions completed")).toBeInTheDocument();
    expect(screen.getByText("4/5 marks")).toBeInTheDocument();
    expect(screen.queryByText("Accuracy")).not.toBeInTheDocument();
    expect(screen.queryByText("Mastery")).not.toBeInTheDocument();
    expect(screen.queryByText("Review due")).not.toBeInTheDocument();
    expect(screen.queryByText(/Level|Day streak/)).not.toBeInTheDocument();
  });

  it("offers a real resume action for an unfinished session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      summary: { completedSessions: 0, rewards: { stars: 1 } },
      sessions: [{ id: "unfinished", status: "in_progress", resumable: true, startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 5, attempts: [{ id: "attempt-1", question_prompt: "Question", correct: true, earned_marks: 1, max_marks: 1 }] }],
    })));

    render(<ChildDashboard />);

    expect(await screen.findByRole("link", { name: /resume session/i })).toHaveAttribute("href", "/study?resume=unfinished");
  });
});
