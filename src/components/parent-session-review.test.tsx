import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParentSessionReview } from "./parent-session-review";

describe("ParentSessionReview", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("shows appeal evidence and lets a parent award final marks without AI", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input) === "/api/parent/progress") return new Response(JSON.stringify({ children: [] }));
      if (String(input) === "/api/parent/score-appeals" && init?.method === "PATCH") return new Response(JSON.stringify({ resolution: { status: "adjusted" } }));
      if (String(input) === "/api/parent/score-appeals") return new Response(JSON.stringify({ pending: [{
        id: "appeal", childName: "Easwar", subject: "Geography", chapterTitle: "Landforms",
        question: "What does the Isthmus of Suez join and separate?", childAnswer: "It joins Asia and Africa and separates the Mediterranean Sea and Red Sea.",
        expectedAnswer: "It joins Africa and Asia and separates the two seas.", explanation: "One point awarded.",
        rubric: { points: [{ concept: "joins Asia and Africa" }, { concept: "separates the Mediterranean Sea and Red Sea" }] },
        originalEarnedMarks: 1, maxMarks: 2, sourcePages: [12], gradingMeta: { model: "deepseek/deepseek-v4-flash" }, childComment: "Both points are present.",
      }] }));
      throw new Error(`Unexpected request: ${String(input)}`);
    });

    render(<ParentSessionReview />);
    expect(await screen.findByText("Score appeals (1)")).toBeInTheDocument();
    expect(screen.getByText("Both points are present.")).toBeInTheDocument();
    expect(screen.getByText("separates the Mediterranean Sea and Red Sea")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Final marks"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /save final marks/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/parent/score-appeals", expect.objectContaining({ method: "PATCH", body: expect.stringContaining('"earnedMarks":2') })));
  });
});
