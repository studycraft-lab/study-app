import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import source from "../../lesson-packs/icse-6-biology/plastids/v1.json";
import { validateLessonPack } from "@/lib/tutor/validate";
import { TutorPlayer } from "./tutor-player";
afterEach(cleanup);
it("renders the reviewed Plastids scenes through four rehearsed checkpoints and the shared recap", async () => {
  const result = validateLessonPack(source); if (!result.valid) throw new Error();
  render(<TutorPlayer pack={result.pack} />);
  for (const [index,step] of result.pack.steps.entries()) {
    const scene = result.pack.scenes.find(s => s.id===step.sceneId)!;
    expect(screen.getByRole("img",{ name: scene.label })).toBeVisible();
    expect(screen.getByLabelText("Tutor caption")).toHaveTextContent(step.narration);
    fireEvent.click(screen.getByRole("button",{ name: "I have read the explanation" }));
    fireEvent.click(await screen.findByRole("button",{ name: "I understand — ask me a question" }));
    expect(screen.getByRole("status")).toHaveTextContent(`${index} / 4 tutoring stars`);
    fireEvent.click(screen.getByRole("button",{ name: step.checkpoint.options.find(o => o.id===step.checkpoint.correctOptionId)!.text }));
    fireEvent.click(await screen.findByRole("button",{ name: index===3 ? "See recap" : "Continue to next step" }));
  }
  expect(screen.getByRole("img",{ name: "Comparison of the three plastid types" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("4 / 4 tutoring stars");
  fireEvent.click(screen.getByRole("button",{ name: "Finish lesson" }));
  expect(screen.getByText(/Lesson complete/)).toBeVisible();
});
