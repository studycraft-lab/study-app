import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("retries an ungraded answer without creating a score appeal", async () => {
    let loaded = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/study/answer") return new Response(JSON.stringify({ correct: true, earnedMarks: 4 }));
      loaded += 1;
      return new Response(JSON.stringify({
        id: "session-1", status: "completed", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 1,
        attempts: [{ id: "attempt-1", prompt: "Why are organelles important?", answer: "My answer", correct: loaded > 1, earnedMarks: loaded > 1 ? 4 : 0, maxMarks: 4, status: loaded > 1 ? "Correct" : "Automatic grading pending", correctAnswer: loaded > 1 ? "Expected" : "Not graded yet", explanation: loaded > 1 ? "Checked." : "The grading service timed out.", gradingPending: loaded === 1, retryAvailable: loaded === 1 }],
      }));
    });

    render(<ChildSessionReview sessionId="session-1" />);
    fireEvent.click(await screen.findByRole("button", { name: /retry automatic grading/i }));
    await waitFor(() => expect(screen.getByText("Correct")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/study/answer", expect.objectContaining({ method: "POST", body: JSON.stringify({ retryAttemptId: "attempt-1" }) }));
    expect(fetchMock.mock.calls.some(([input]) => String(input) === "/api/study/score-appeals")).toBe(false);
  });

  it("lets a child appeal a completed automatic grade", async () => {
    let appealed = false;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/study/score-appeals") { appealed = true; return new Response(JSON.stringify({ appeal: { status: "pending" } })); }
      return new Response(JSON.stringify({
        id: "session-1", status: "completed", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 1,
        attempts: [{ id: "attempt-1", prompt: "What joins Asia and Africa?", answer: "Isthmus of Suez", correct: false, earnedMarks: 1, maxMarks: 2, status: "Partly correct", correctAnswer: "Isthmus of Suez", explanation: "One mark awarded.", scoreAppeal: appealed ? { status: "pending" } : null }],
      }));
    });

    render(<ChildSessionReview sessionId="session-1" />);
    fireEvent.click(await screen.findByRole("button", { name: /appeal score/i }));
    fireEvent.change(screen.getByLabelText(/why should the score change/i), { target: { value: "Both points are present." } });
    fireEvent.click(screen.getByRole("button", { name: /send to parent/i }));
    await waitFor(() => expect(screen.getByText(/score appeal: pending/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/study/score-appeals", expect.objectContaining({ method: "POST", body: JSON.stringify({ attemptId: "attempt-1", comment: "Both points are present." }) }));
  });
});
