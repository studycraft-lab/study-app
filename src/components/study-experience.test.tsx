import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudyExperience } from "./study-experience";

const questions = [
  { id: "q1", type: "single_choice", prompt: "Which period?", marks: 1, response: { options: [{ id: "early", text: "Early Vedic" }, { id: "later", text: "Later Vedic" }] } },
  ...Array.from({ length: 4 }, (_, index) => ({ id: `q${index + 2}`, type: "fill_blank", prompt: `Question ${index + 2}`, marks: 1, response: {} })),
];

describe("StudyExperience", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState({}, "", "/"); });

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
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(await screen.findByText(/incorrect/i)).toBeInTheDocument();
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

  it("reviews mistakes without creating a one-question session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/study/library") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" }, chapters: [{ id: "bank", subject: "History", chapterTitle: "Early Vedic", grade: 6, board: "ICSE", questionCount: 5 }] }));
      if (url === "/api/study/history") return new Response(JSON.stringify({ summary: { completedSessions: 0, attempts: 0, uniqueQuestions: 0, accuracy: 0, mastery: 0, dueReview: 0 }, topics: [], sessions: [] }));
      if (url.startsWith("/api/study/questions")) return new Response(JSON.stringify({ questions }));
      if (url === "/api/study/sessions" && init?.method === "POST") return new Response(JSON.stringify({ sessionId: "session" }), { status: 201 });
      if (url === "/api/study/sessions" && init?.method === "PATCH") return new Response(JSON.stringify({ completed: true }));
      if (url === "/api/study/answer") {
        const body = JSON.parse(String(init?.body));
        const correct = body.questionId !== "q1";
        return new Response(JSON.stringify({ correct, earnedMarks: correct ? 1 : 0, expectedAnswer: correct ? "Answer" : "Early Vedic", explanation: correct ? "Correct." : "The timeline shows the Early Vedic period.", sourcePages: [49], attemptId: `attempt-${body.questionId}` }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<StudyExperience />);
    fireEvent.click(await screen.findByRole("button", { name: /early vedic/i }));
    fireEvent.click(await screen.findByLabelText("Later Vedic"));
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    await screen.findByText(/incorrect/i);
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));

    for (let index = 2; index <= 5; index += 1) {
      fireEvent.change(await screen.findByLabelText("Your answer"), { target: { value: "Answer" } });
      fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
      await screen.findByText("✓ Correct");
      fireEvent.click(screen.getByRole("button", { name: index === 5 ? /see results/i : /next question/i }));
    }

    fireEvent.click(await screen.findByRole("button", { name: /review mistakes/i }));
    expect(await screen.findByText("Which period?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Expected: Early Vedic");
    expect(fetchMock.mock.calls.filter(([url, request]) => String(url) === "/api/study/sessions" && request?.method === "POST")).toHaveLength(1);
  });

  it("shows consistent marks and resumes a stored unfinished session", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/study/library") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" }, chapters: [] }));
      if (url === "/api/study/history") return new Response(JSON.stringify({ summary: { completedSessions: 0, attempts: 2, uniqueQuestions: 2, accuracy: 50, mastery: 50, dueReview: 1 }, topics: [], sessions: [{ id: "unfinished", bankId: "bank", status: "in_progress", startedAt: "2026-09-01T00:00:00.000Z", totalQuestions: 5, resumable: true, attempts: [{ id: "a1", question_prompt: "One", correct: true, earned_marks: 1, max_marks: 1, feedback: {} }, { id: "a2", question_prompt: "Two", correct: false, earned_marks: 0, max_marks: 2, feedback: {} }] }] }));
      if (url === "/api/study/sessions?sessionId=unfinished") return new Response(JSON.stringify({ bankId: "bank", questions, attempts: [] }));
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<StudyExperience />);
    expect(await screen.findByText("1/3 marks")).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 answered/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resume session/i }));
    expect(await screen.findByText("Which period?")).toBeInTheDocument();
  });

  it("resumes a session opened from the child dashboard", async () => {
    window.history.replaceState({}, "", "/study?resume=unfinished");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/study/library") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" }, chapters: [] }));
      if (url === "/api/study/history") return new Response(JSON.stringify({ summary: { completedSessions: 0 }, topics: [], sessions: [] }));
      if (url === "/api/study/sessions?sessionId=unfinished") return new Response(JSON.stringify({ bankId: "bank", questions, attempts: [] }));
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<StudyExperience />);

    expect(await screen.findByText("Which period?")).toBeInTheDocument();
  });

  it("accepts a free-text answer and explains covered and missing rubric points", async () => {
    const subjective = [{ id: "essay", type: "multi_point", prompt: "Why was the rajan not absolute?", marks: 2, response: { recommendedPoints: 4 } }];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/study/library") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" }, chapters: [{ id: "bank", subject: "History", chapterTitle: "Early Vedic", grade: 6, board: "ICSE", questionCount: 10 }] }));
      if (url === "/api/study/history") return new Response(JSON.stringify({ summary: { completedSessions: 0, attempts: 0, uniqueQuestions: 0, accuracy: 0, mastery: 0, dueReview: 0 }, topics: [], sessions: [] }));
      if (url.startsWith("/api/study/questions")) return new Response(JSON.stringify({ questions: subjective, presentationSeed: "seed" }));
      if (url === "/api/study/sessions") return new Response(JSON.stringify({ sessionId: "session" }), { status: 201 });
      return new Response(JSON.stringify({ correct: false, earnedMarks: 1, expectedAnswer: "The councils controlled him.", explanation: "You identified one council.", coveredPoints: ["sabha advised the rajan"], partialPoints: [], missingPoints: ["samiti allowed tribal opinions"], sourcePages: [47], attemptId: "attempt" }));
    });
    render(<StudyExperience />);
    fireEvent.click(await screen.findByRole("button", { name: /early vedic/i }));
    fireEvent.change(await screen.findByLabelText("Your answer"), { target: { value: "The sabha advised him." } });
    fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(await screen.findByText(/partly correct — 1\/2 marks/i)).toBeInTheDocument();
    expect(screen.getByText("sabha advised the rajan")).toBeInTheDocument();
    expect(screen.getByText("samiti allowed tribal opinions")).toBeInTheDocument();
  });
});
