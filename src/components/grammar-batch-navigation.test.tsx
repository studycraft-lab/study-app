import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GrammarBatchNavigation } from "./grammar-batch-navigation";

describe("GrammarBatchNavigation", () => {
  afterEach(cleanup);
  it("shows perfect, partial, review and unstarted batches with scores", () => {
    const onOpen = vi.fn();
    render(<GrammarBatchNavigation batchCount={4} batchSize={5} currentIndex={1} onOpen={onOpen} batches={[
      { batchIndex: 0, results: Array(5).fill({ status: "correct" as const }) },
      { batchIndex: 1, results: [...Array(3).fill({ status: "correct" as const }), ...Array(2).fill({ status: "incorrect" as const })] },
      { batchIndex: 2, results: [...Array(4).fill({ status: "correct" as const }), { status: "review" as const }] },
    ]} />);
    const perfect = screen.getByRole("button", { name: "Batch 1: 5 of 5 correct" });
    const partial = screen.getByRole("button", { name: "Batch 2: 3 of 5 correct" });
    const review = screen.getByRole("button", { name: "Batch 3: 4 of 5 correct, 1 answer needs review" });
    const unstarted = screen.getByRole("button", { name: "Batch 4: not checked" });
    expect(perfect).toHaveClass("is-perfect");
    expect(perfect).toHaveTextContent("5/5");
    expect(partial).toHaveClass("is-partial", "is-current");
    expect(partial).toHaveAttribute("aria-current", "step");
    expect(review).toHaveClass("is-review");
    expect(review).toHaveTextContent("4/5 ?");
    expect(unstarted).not.toHaveClass("is-perfect", "is-partial", "is-review");
    fireEvent.click(review);
    expect(onOpen).toHaveBeenCalledWith(2);
  });

  it("recognises fully correct Question Tags batches", () => {
    render(<GrammarBatchNavigation batchCount={1} batchSize={5} currentIndex={0} onOpen={() => {}} batches={[
      { batchIndex: 0, results: Array(5).fill({ correct: true }) },
    ]} />);
    expect(screen.getByRole("button", { name: "Batch 1: 5 of 5 correct" })).toHaveClass("is-perfect");
  });
});
