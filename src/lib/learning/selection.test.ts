import { describe, expect, it } from "vitest";

import { selectQuestionIds } from "./selection";

describe("selectQuestionIds", () => {
  it("builds a ten-question exercise with seven objective and three subjective questions", () => {
    const ids = Array.from({ length: 7 }, (_, index) => `o${index + 1}`).concat(Array.from({ length: 4 }, (_, index) => `s${index + 1}`));
    const types = Object.fromEntries(ids.map((id) => [id, id.startsWith("s") ? "brief_answer" : "single_choice"]));
    const selected = selectQuestionIds(ids, [], 10, () => 0, types);
    expect(selected).toHaveLength(10);
    expect(selected.filter((id) => id.startsWith("s"))).toHaveLength(3);
    expect(selected.filter((id) => id.startsWith("o"))).toHaveLength(7);
  });

  it("fills all ten places when one question category is undersupplied", () => {
    const ids = Array.from({ length: 9 }, (_, index) => `o${index + 1}`).concat("s1");
    const types = Object.fromEntries(ids.map((id) => [id, id.startsWith("s") ? "multi_point" : "fill_blank"]));
    const selected = selectQuestionIds(ids, [], 10, () => 0, types);
    expect(selected).toHaveLength(10);
    expect(new Set(selected).size).toBe(10);
  });

  it("mixes at most two weak questions with unseen questions when available", () => {
    const selected = selectQuestionIds(
      ["w1", "w2", "w3", "n1", "n2", "n3", "r1", "r2"],
      [
        { questionId: "w1", attempted: true, latestCorrect: false, due: false },
        { questionId: "w2", attempted: true, latestCorrect: false, due: true },
        { questionId: "w3", attempted: true, latestCorrect: false, due: false },
        { questionId: "r1", attempted: true, latestCorrect: true, due: false },
        { questionId: "r2", attempted: true, latestCorrect: true, due: false },
      ],
      5,
      () => 0,
    );

    expect(selected).toHaveLength(5);
    expect(selected.filter((id) => id.startsWith("w"))).toHaveLength(2);
    expect(selected).toEqual(expect.arrayContaining(["n1", "n2", "n3"]));
  });

  it("fills the session from weak and reinforcement questions after full coverage", () => {
    const selected = selectQuestionIds(
      ["w1", "w2", "r1", "r2", "r3", "r4"],
      [
        { questionId: "w1", attempted: true, latestCorrect: false, due: false },
        { questionId: "w2", attempted: true, latestCorrect: true, due: true },
        ...["r1", "r2", "r3", "r4"].map((questionId) => ({ questionId, attempted: true, latestCorrect: true, due: false })),
      ],
      5,
      () => 0,
    );

    expect(selected).toHaveLength(5);
    expect(selected).toEqual(expect.arrayContaining(["w1", "w2"]));
  });
});
