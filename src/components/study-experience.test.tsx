import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudyExperience } from "./study-experience";

const questions = [
  { id: "q1", type: "single_choice", prompt: "Which period?", marks: 1, response: { options: [{ id: "early", text: "Early Vedic" }, { id: "later", text: "Later Vedic" }] } },
  ...Array.from({ length: 4 }, (_, index) => ({ id: `q${index + 2}`, type: "fill_blank", prompt: `Question ${index + 2}`, marks: 1, response: {} })),
];

describe("StudyExperience", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("unlocks, selects a chapter, and gives immediate cited feedback", async () => {
    let libraryCalls = 0;
    let profileCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/study/library" && libraryCalls++ === 0) return new Response(JSON.stringify({ error: "locked" }), { status: 401 });
      if (url === "/api/child/profiles" && profileCalls++ === 0) return new Response(JSON.stringify({ error: "locked" }), { status: 401 });
      if (url === "/api/child-preview/unlock") return new Response(JSON.stringify({ unlocked: true }));
      if (url === "/api/child/profiles") return new Response(JSON.stringify({ children: [{ id: "child", displayName: "Asha", grade: 6, board: "ICSE" }] }));
      if (url === "/api/child/login") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" } }));
      if (url === "/api/study/library") return new Response(JSON.stringify({ child: { id: "child", displayName: "Asha", grade: 6, board: "ICSE" }, chapters: [{ id: "bank", subject: "History", chapterTitle: "Early Vedic", grade: 6, board: "ICSE", questionCount: 10 }] }));
      if (url.startsWith("/api/study/questions")) return new Response(JSON.stringify({ questions }));
      return new Response(JSON.stringify({ correct: false, expectedAnswer: "Early Vedic", explanation: "The timeline shows the Early Vedic period.", sourcePages: [49] }));
    });
    render(<StudyExperience />);

    expect(await screen.findByRole("heading", { name: /unlock this device/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/parent passphrase/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    fireEvent.click(await screen.findByRole("button", { name: /asha/i }));
    fireEvent.change(screen.getByLabelText(/asha.*pin/i), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: /start studying/i }));
    fireEvent.click(await screen.findByRole("button", { name: /early vedic/i }));
    expect(await screen.findByText("Which period?")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Later Vedic"));
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    expect(await screen.findByText(/needs work/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Expected: Early Vedic");
    expect(screen.getByText(/Page 49/i)).toBeInTheDocument();
    const reviewFirst = await screen.findByRole("button", { name: /question 1: incorrect.*review answer/i });
    fireEvent.click(screen.getByRole("button", { name: /next question/i }));
    expect(await screen.findByText("Question 2")).toBeInTheDocument();

    fireEvent.click(reviewFirst);
    expect(await screen.findByText("Which period?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Expected: Early Vedic");
    fireEvent.click(screen.getByRole("button", { name: /back to current question/i }));
    await waitFor(() => expect(screen.getByText("Question 2")).toBeInTheDocument());
  });
});
