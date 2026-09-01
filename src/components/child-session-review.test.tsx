import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChildSessionReview } from "./child-session-review";

describe("ChildSessionReview", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("shows correctness, the child's answer, the correct answer, and feedback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      id: "session-1", status: "completed", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 1,
      attempts: [{ id: "attempt-1", prompt: "What was the staple food?", answer: "Meat", correct: false, earnedMarks: 0, maxMarks: 1, status: "Incorrect", correctAnswer: "Wheat", explanation: "Meat was eaten only occasionally." }],
    })));

    render(<ChildSessionReview sessionId="session-1" />);

    expect(await screen.findByText("Incorrect")).toBeInTheDocument();
    expect(screen.getByText("Meat")).toBeInTheDocument();
    expect(screen.getByText("Wheat")).toBeInTheDocument();
    expect(screen.getByText("Meat was eaten only occasionally.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/study/history/session-1", { cache: "no-store" });
  });
});
