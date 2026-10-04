import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GRAMMAR_LESSONS, publicGrammarQuestion, type GrammarSlug } from "@/lib/english/grammar-lessons";
import { GrammarLessonExperience } from "./grammar-lesson-experience";

function mockLesson(slug: GrammarSlug, batches: { batchIndex: number; answers: string[]; results: never[] }[] = []) {
  const lesson = GRAMMAR_LESSONS[slug];
  vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
    child: { displayName: "Student" },
    lesson: { title: lesson.title, batchSize: lesson.batchSize, introduction: lesson.introduction, rules: lesson.rules, worked: lesson.worked },
    questions: lesson.questions.map(publicGrammarQuestion),
    batches,
  }));
}

describe("GrammarLessonExperience rewrite starters", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("prefills tense rewrites with only the sentence, then lets the child edit it", async () => {
    mockLesson("tenses");
    render(<GrammarLessonExperience slug="tenses" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start batch 1 of 8" }));
    const boxes = screen.getAllByRole("textbox", { name: "Rewrite the complete sentence" }) as HTMLTextAreaElement[];
    expect(boxes[0].value).toBe("The children are decorating the classroom for the competition.");
    expect(boxes[1].value).toBe("The chef prepares fresh bread every morning.");
    fireEvent.change(boxes[0], { target: { value: "The children decorated the classroom for the competition." } });
    expect(boxes[0].value).toBe("The children decorated the classroom for the competition.");
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    const next = screen.getAllByRole("textbox", { name: "Rewrite the complete sentence" }) as HTMLTextAreaElement[];
    expect(next[0].value).toBe("The workers have been painting the school building since Monday.");
  });

  it("prefills pronoun corrections with the original sentence", async () => {
    mockLesson("pronouns");
    render(<GrammarLessonExperience slug="pronouns" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start batch 1 of 8" }));
    const boxes = screen.getAllByRole("textbox", { name: "Rewrite the complete sentence" }) as HTMLTextAreaElement[];
    expect(boxes[0].value).toBe("The teacher spoke to she after the class.");
    expect(boxes[4].value).toBe("The boy which won the race received a medal.");
  });

  it("prefills conjunction sentence joins with the two original sentences", async () => {
    mockLesson("conjunctions");
    render(<GrammarLessonExperience slug="conjunctions" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start batch 1 of 8" }));
    const boxes = screen.getAllByRole("textbox", { name: "Join the sentences without using and, but or so" }) as HTMLTextAreaElement[];
    expect(boxes[0].value).toBe("The road was slippery. The driver managed to control the car.");
  });

  it("keeps saved answers when revisiting a checked batch", async () => {
    const answers = ["Custom answer one", "Custom answer two", "", "", ""];
    mockLesson("pronouns", [{ batchIndex: 0, answers, results: [] }]);
    render(<GrammarLessonExperience slug="pronouns" />);
    fireEvent.click(await screen.findByRole("button", { name: "Start batch 2 of 8" }));
    fireEvent.click(screen.getByRole("button", { name: /1 ✓/ }));
    const boxes = screen.getAllByRole("textbox", { name: "Rewrite the complete sentence" }) as HTMLTextAreaElement[];
    expect(boxes[0].value).toBe("Custom answer one");
    expect(boxes[1].value).toBe("Custom answer two");
  });
});
