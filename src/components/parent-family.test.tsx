import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParentFamily } from "./parent-family";

describe("ParentFamily", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("opens the family workspace and exposes child profile management", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => String(input) === "/api/parent/progress"
      ? new Response(JSON.stringify({ children: [{ child: { id: "one", displayName: "Asha", board: "ICSE", grade: 6, active: true }, history: { summary: { completedSessions: 2, attempts: 10, accuracy: 80, mastery: 75, dueReview: 1 }, sessions: [] } }] }))
      : new Response(JSON.stringify({ family: { name: "Our family" }, parent: { displayName: "Parent" }, children: [{ id: "one", displayName: "Asha", board: "ICSE", grade: 6, active: true }] })));
    render(<ParentFamily />);
    expect(await screen.findByText("Our family")).toBeInTheDocument();
    expect(screen.queryByLabelText(/parent passphrase/i)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Asha")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /add a child/i })).toBeInTheDocument();
    expect(screen.getByText("80% accuracy")).toBeInTheDocument();
  });

  it("requires explicit confirmation before deleting a session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input) === "/api/parent/progress/session" && init?.method === "DELETE") return new Response(JSON.stringify({ deleted: true }));
      if (String(input) === "/api/parent/progress") return new Response(JSON.stringify({ children: [{ child: { id: "one", displayName: "Asha", board: "ICSE", grade: 6, active: true }, history: { summary: { completedSessions: 1, attempts: 5, accuracy: 80, mastery: 75, dueReview: 1 }, sessions: [{ id: "session-1", status: "completed", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 5, attempts: [{ correct: true, earned_marks: 1, max_marks: 1 }] }] } }] }));
      return new Response(JSON.stringify({ family: { name: "Our family" }, parent: { displayName: "Parent" }, children: [{ id: "one", displayName: "Asha", board: "ICSE", grade: 6, active: true }] }));
    });

    render(<ParentFamily />);
    fireEvent.click(await screen.findByRole("button", { name: /delete session/i }));
    expect(screen.getByText("1/1 marks")).toBeInTheDocument();
    expect(screen.getByText(/1 of 5 answered/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, request]) => request?.method === "DELETE")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /delete permanently/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/parent/progress/session", expect.objectContaining({ method: "DELETE", body: JSON.stringify({ childId: "one", sessionId: "session-1" }) })));
  });
});
