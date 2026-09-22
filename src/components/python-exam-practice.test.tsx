import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import bank from "../../ingestion-artifacts/python-conditional-statements-question-bank.json";
import { PythonExamPractice, type PracticeQuestion } from "./python-exam-practice";

const questions = bank.questions as PracticeQuestion[];

describe("PythonExamPractice", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
  it("opens a 5-mark program and lets a child compare code with a worked answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } }));
    render(<PythonExamPractice questions={questions} />);
    expect(await screen.findByRole("heading", { name: "Python Programming" })).toBeInTheDocument();
    expect(screen.getByText(/15 programming questions/)).toBeInTheDocument();
    expect(screen.getByText(/water meter has today’s and yesterday’s readings/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Write your Python answer" }), { target: { value: 'num = int(input("Number: "))\nif num > 0:\n    print("The number is positive")' } });
    fireEvent.click(screen.getByRole("button", { name: "Compare with example" }));
    expect(screen.getByText("One correct way")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I've reviewed my program" }));
    expect(screen.getByText("1 programs reviewed")).toBeInTheDocument();
  });
  it("checks an exam-style objective question against its bank answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } }));
    render(<PythonExamPractice questions={questions} />);
    await screen.findByRole("heading", { name: "Python Programming" });
    fireEvent.click(screen.getByRole("button", { name: "Exam-style Python mix" }));
    expect(screen.getByText("Which form runs code only when its condition is True?")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("if", { exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct");
    expect(screen.getByText("1 short questions correct")).toBeInTheDocument();
  });
});
