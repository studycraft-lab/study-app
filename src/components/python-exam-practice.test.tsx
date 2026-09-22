import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import bank from "../../ingestion-artifacts/python-conditional-statements-question-bank.json";
import { PythonExamPractice, type PracticeQuestion } from "./python-exam-practice";
import { runPythonCases } from "@/lib/python/browser-runner";
vi.mock("@/lib/python/browser-runner", () => ({ runPythonCases: vi.fn() }));

const questions = bank.questions as PracticeQuestion[];

describe("PythonExamPractice", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
  it("runs a 5-mark program and reports the test results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } }));
    vi.mocked(runPythonCases).mockResolvedValue([
      { output: "600\nToo much water used today, check for leakage\n", error: "" },
      { output: "500\nWater usage is normal\n", error: "" },
      { output: "450\nWater usage is normal\n", error: "" },
    ]);
    render(<PythonExamPractice questions={questions} />);
    expect(await screen.findByRole("heading", { name: "Python Programming" })).toBeInTheDocument();
    expect(screen.getByText(/15 programming questions/)).toBeInTheDocument();
    expect(screen.getByText(/water meter has today’s and yesterday’s readings/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Write your Python answer" }), { target: { value: 'today = int(input())\nyesterday = int(input())\nused = today - yesterday\nprint(used)\nif used > 500: print("Too much water used today, check for leakage")\nelse: print("Water usage is normal")' } });
    fireEvent.click(screen.getByRole("button", { name: "Run checks" }));
    expect(await screen.findByText("3 of 3 test cases passed")).toBeInTheDocument();
    expect(screen.getByText("1 programs passed")).toBeInTheDocument();
    expect(runPythonCases).toHaveBeenCalledWith(expect.stringContaining("today = int(input())"), expect.arrayContaining([expect.objectContaining({ name: "Exactly 500 litres" })]));
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
