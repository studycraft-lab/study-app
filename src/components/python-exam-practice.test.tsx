import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByText(/water meter has today’s and yesterday’s readings/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Write your Python answer" }), { target: { value: 'today = int(input())\nyesterday = int(input())\nused = today - yesterday\nprint(used)\nif used > 500: print("Too much water used today, check for leakage")\nelse: print("Water usage is normal")' } });
    fireEvent.click(screen.getByRole("button", { name: "Run checks" }));
    expect(await screen.findByText("3 of 3 test cases passed")).toBeInTheDocument();
    expect(screen.getByText("1 program passed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See one solution" })).toBeInTheDocument();
    expect(runPythonCases).toHaveBeenCalledWith(expect.stringContaining("today = int(input())"), expect.arrayContaining([expect.objectContaining({ name: "Exactly 500 litres" })]));
  });
  it("hides the solution until every program check passes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } }));
    vi.mocked(runPythonCases)
      .mockResolvedValueOnce(Array.from({ length: 3 }, () => ({ output: "0\n", error: "" })))
      .mockResolvedValueOnce([
        { output: "600\nToo much water used today, check for leakage\n", error: "" },
        { output: "500\nWater usage is normal\n", error: "" },
        { output: "450\nWater usage is normal\n", error: "" },
      ]);
    render(<PythonExamPractice questions={questions} />);
    await screen.findByRole("heading", { name: "Python Programming" });
    const editor = screen.getByRole("textbox", { name: "Write your Python answer" });
    fireEvent.change(editor, { target: { value: "print(0)" } });
    fireEvent.click(screen.getByRole("button", { name: "Run checks" }));
    expect(await screen.findByText("0 of 3 test cases passed")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See one solution" })).not.toBeInTheDocument();
    fireEvent.change(editor, { target: { value: "print(600)" } });
    fireEvent.click(screen.getByRole("button", { name: "Run checks" }));
    expect(await screen.findByText("3 of 3 test cases passed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See one solution" })).toBeInTheDocument();
  });
  it("checks an exam-style objective question against its bank answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } }));
    render(<PythonExamPractice questions={questions} />);
    await screen.findByRole("heading", { name: "Python Programming" });
    fireEvent.click(screen.getByRole("button", { name: "Exam-style Python mix" }));
    expect(screen.getByText("Which form runs code only when its condition is True?")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("if", { exact: true }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByRole("heading", { name: "Correct" })).toBeInTheDocument();
    expect(screen.getByText("1 short question correct")).toBeInTheDocument();
  });
  it("loads completed programs from the account and restarts one", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const path = String(input);
      if (path === "/api/study/library") return Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } });
      if (path === "/api/study/python-progress" && !init?.method) return Response.json({ entries: [{ questionId: "q-037", answer: "print(600)", checked: false, passed: true }] });
      if (path === "/api/study/python-progress" && init?.method === "PUT") return Response.json({ item: JSON.parse(String(init.body)) });
      throw new Error(`Unexpected fetch: ${path}`);
    });
    render(<PythonExamPractice questions={questions} />);
    expect(await screen.findByRole("heading", { name: "Python Programming" })).toBeInTheDocument();
    expect(screen.getByText("1 program passed")).toBeInTheDocument();
    const waterMeter = screen.getByRole("button", { name: /Water meter/ });
    expect(waterMeter).toHaveClass("is-complete");
    fireEvent.click(waterMeter);
    expect(screen.getByRole("textbox", { name: "Write your Python answer" })).toHaveValue("print(600)");
    fireEvent.click(screen.getByRole("button", { name: "Restart this program" }));
    expect(screen.getByRole("textbox", { name: "Write your Python answer" })).toHaveValue("");
    expect(screen.getByText("0 programs passed")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/study/python-progress", expect.objectContaining({ method: "PUT", body: JSON.stringify({ questionId: "q-037", answer: "", checked: false, passed: false }) })));
  });
  it("resumes the exam mix at the first unfinished question", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input) === "/api/study/library") return Response.json({ child: { id: "asha", displayName: "Asha", grade: 6 } });
      return Response.json({ entries: [
        { questionId: "q-001", answer: "option-1", checked: true, passed: false },
        { questionId: "q-002", answer: "option-2", checked: true, passed: false },
        { questionId: "q-031", answer: "print('My school')", checked: false, passed: true },
      ] });
    });
    render(<PythonExamPractice questions={questions} />);
    await screen.findByRole("heading", { name: "Python Programming" });
    fireEvent.click(screen.getByRole("button", { name: "Exam-style Python mix" }));
    expect(screen.getByText(/Question 4 of 58/)).toBeInTheDocument();
    expect(screen.getByText("An if...elif...else ladder stops checking when...")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "← Previous" }));
    expect(screen.getByText(/Question 3 of 58/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Jump to next unfinished" }));
    expect(screen.getByText(/Question 4 of 58/)).toBeInTheDocument();
  });
});
