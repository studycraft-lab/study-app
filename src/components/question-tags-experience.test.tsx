import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QUESTION_TAGS_LESSON, gradeQuestionTagBatch, publicQuestion } from "@/lib/english/question-tags";
import { QuestionTagsExperience } from "./question-tags-experience";

const questions = QUESTION_TAGS_LESSON.questions.map(publicQuestion);
const lesson = { title: "Question Tags", subject: "English Language", batchSize: 5 };

describe("QuestionTagsExperience", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("checks five answers with one submission and moves to the next five", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (!init?.method) return Response.json({ lesson, questions, batches: [] });
      const body = JSON.parse(String(init.body));
      return Response.json({ batch: { batchIndex: body.batchIndex, answers: body.answers, results: gradeQuestionTagBatch(body.batchIndex, body.answers) } });
    });
    render(<QuestionTagsExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "Start batch 1 of 8" }));
    expect(screen.getAllByText(/^Question [1-5] · School worksheet$/)).toHaveLength(5);
    const inputs = screen.getAllByRole("textbox", { name: "Write the missing tag" });
    expect(inputs).toHaveLength(5);
    fireEvent.change(inputs[0], { target: { value: "aren't they" } });
    fireEvent.click(screen.getByRole("button", { name: "Check five answers" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/study/grammar/question-tags", expect.objectContaining({ method: "POST" })));
    expect(await screen.findByText("1 of 5 correct")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next five" }));
    expect(screen.getByRole("heading", { name: "Batch 2 of 8" })).toBeInTheDocument();
  });

  it("resumes at the first unchecked batch", async () => {
    const answers = QUESTION_TAGS_LESSON.questions.slice(0, 5).map((question) => question.answer);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ lesson, questions, batches: [{ batchIndex: 0, answers, results: gradeQuestionTagBatch(0, answers) }] }));
    render(<QuestionTagsExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "Start batch 2 of 8" }));
    expect(screen.getByRole("heading", { name: "Batch 2 of 8" })).toBeInTheDocument();
  });
});
