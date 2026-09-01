import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ParentLibrary } from "./parent-library";

describe("ParentLibrary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("explains the Codex-to-JSON MVP flow without repeated parent authentication", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => String(input) === "/api/parent/question-reports" ? new Response(JSON.stringify({ reports: [] })) : new Response(JSON.stringify({ chapters: [] })));
    render(<ParentLibrary />);
    expect(screen.getByRole("heading", { name: /content library/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/question-bank json/i)).toBeInTheDocument();
    expect(screen.getByText(/Codex/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /validate/i })).toBeDisabled();
    expect(screen.queryByLabelText(/parent passphrase/i)).not.toBeInTheDocument();
  });

  it("clears an earlier library error after a successful retry", async () => {
    let libraryCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/parent/question-reports") return new Response(JSON.stringify({ reports: [] }));
      if (libraryCalls++ === 0) return new Response(JSON.stringify({ error: "permission denied for view library_chapters" }), { status: 500 });
      return new Response(JSON.stringify({ chapters: [] }));
    });
    render(<ParentLibrary />);
    expect(await screen.findByText(/permission denied/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /refresh library/i }));
    await waitFor(() => expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument());
  });

  it("confirms that a newer payload replaced an unattempted draft bank", async () => {
    const preview = {
      board: "ICSE", grade: 6, subject: "History", bookTitle: "History and Civics",
      chapterNumber: 5, chapterTitle: "The Early Vedic Civilization", questionCount: 40, sourceCount: 9,
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/question-banks/validate") return new Response(JSON.stringify({ valid: true, preview }));
      if (url === "/api/question-banks/import") return new Response(JSON.stringify({ imported: true, created: false, replaced: true, id: "bank-row" }));
      if (url === "/api/parent/question-reports") return new Response(JSON.stringify({ reports: [] }));
      return new Response(JSON.stringify({ chapters: [{ ...preview, id: "bank-row", bankVersion: 1 }] }));
    });
    render(<ParentLibrary />);
    fireEvent.change(screen.getByLabelText(/question-bank json/i), {
      target: { files: [new File([JSON.stringify({ bank: { id: "early-vedic-civilization-v1" } })], "early-vedic.json", { type: "application/json" })] },
    });

    fireEvent.click(screen.getByRole("button", { name: /validate json/i }));
    fireEvent.click(await screen.findByRole("button", { name: /confirm and import/i }));

    expect(await screen.findByText(/replaced with the latest content/i)).toBeInTheDocument();
    expect(await screen.findByText(/40 questions · bank v1/i)).toBeInTheDocument();
  });

  it("shows grouped report context and only disable or dismiss actions", async () => {
    const report = {
      id: "report", status: "open", bankVersion: 1, questionId: "q4", questionVersion: 1,
      questionSnapshot: { id: "q4", prompt: "The dress had three pieces.", explanation: "It had two.", answer: { value: false }, response: {}, rubric: {}, sourceRefs: [] },
      chapter: { title: "Early Vedic Civilization", subject: "History", grade: 6, board: "ICSE" },
      reporters: ["Asha", "Arun"], reportCount: 2, sourcePages: [48], createdAt: "2026-09-01T00:00:00Z", resolution: null,
      attempts: [
        { reportId: "one", reporterName: "Asha", note: "The wording is confusing" },
        { reportId: "two", reporterName: "Arun", note: null, response: "Two garments", correct: false, earnedMarks: 0, maxMarks: 2, feedback: { expectedAnswer: "False", explanation: "It had two garments.", sourcePages: [48] }, attemptedAt: "2026-09-01T00:00:00Z" },
      ],
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input) === "/api/parent/question-reports") {
        if (init?.method === "PATCH") return new Response(JSON.stringify({ revised: { bankVersion: 2 } }));
        return new Response(JSON.stringify({ reports: { open: [report], resolved: [] } }));
      }
      return new Response(JSON.stringify({ chapters: [] }));
    });
    render(<ParentLibrary />);
    expect(await screen.findByText(/2 reports grouped/i)).toBeInTheDocument();
    expect(screen.getByText(/reported before answering/i)).toBeInTheDocument();
    expect(screen.getByText(/the wording is confusing/i)).toBeInTheDocument();
    expect(screen.getByText("Two garments")).toBeInTheDocument();
    expect(screen.getByText(/Textbook page 48/i)).toBeInTheDocument();
    expect(screen.queryByText(/answer json/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publish correction/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss as valid/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /disable question/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/parent/question-reports", expect.objectContaining({ body: expect.stringContaining('"action":"disable"') })));
  });
});
