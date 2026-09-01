import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudyExperience } from "./study-experience";

const questions = [
  { id: "q1", type: "single_choice", prompt: "Which period?", marks: 1, response: { options: [{ id: "early", text: "Early Vedic" }, { id: "later", text: "Later Vedic" }] } },
  ...Array.from({ length: 4 }, (_, index) => ({ id: `q${index + 2}`, type: "fill_blank", prompt: `Question ${index + 2}`, marks: 1, response: {} })),
];

describe("StudyExperience", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("uses an existing child session and gives immediate cited feedback", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/study/library") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" }, chapters: [{ id: "bank", subject: "History", chapterTitle: "Early Vedic", grade: 6, board: "ICSE", questionCount: 10 }] }));
      if (url === "/api/study/history") return new Response(JSON.stringify({ summary: { completedSessions: 0, attempts: 0, uniqueQuestions: 0, accuracy: 0, mastery: 0, dueReview: 0 }, topics: [], sessions: [] }));
      if (url.startsWith("/api/study/questions")) return new Response(JSON.stringify({ questions }));
      if (url === "/api/study/sessions") return new Response(JSON.stringify({ sessionId: "session" }), { status: 201 });
      if (url === "/api/study/question-reports") return new Response(JSON.stringify({ reportId: "report" }), { status: 201 });
      return new Response(JSON.stringify({ correct: false, earnedMarks: 0, expectedAnswer: "Early Vedic", explanation: "The timeline shows the Early Vedic period.", sourcePages: [49], attemptId: "attempt" }));
    });
    render(<StudyExperience />);

    fireEvent.click(await screen.findByRole("button", { name: /early vedic/i }));
    expect(await screen.findByText("Which period?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /give feedback/i }));
    fireEvent.change(screen.getByLabelText(/what seems wrong/i), { target: { value: "The wording is confusing" } });
    fireEvent.click(screen.getByRole("button", { name: /report question/i }));
    expect(await screen.findByRole("button", { name: /feedback sent/i })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/study/question-reports", expect.objectContaining({ body: expect.stringContaining('"questionId":"q1"') }));

    fireEvent.click(screen.getByLabelText("Later Vedic"));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(await screen.findByText(/needs work/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Expected: Early Vedic");
    expect(screen.getByText(/Page 49/i)).toBeInTheDocument();
    const reviewFirst = await screen.findByRole("button", { name: /question 1: incorrect.*review answer/i });
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    expect(await screen.findByText("Question 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();

    fireEvent.click(reviewFirst);
    expect(await screen.findByText("Which period?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Expected: Early Vedic");
    fireEvent.click(screen.getByRole("button", { name: /back to current question/i }));
    await waitFor(() => expect(screen.getByText("Question 2")).toBeInTheDocument());
  });
});
