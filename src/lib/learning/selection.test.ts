import { describe, expect, it } from "vitest";

import { selectQuestionIds, type QuestionSelectionMetadata } from "./selection";

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

  it("reserves half of a ten-question exercise for end exercises until they are exhausted", () => {
    const exerciseIds = ["eo1", "eo2", "eo3", "eo4", "es1", "es2"];
    const regularIds = ["ro1", "ro2", "ro3", "ro4", "ro5", "rs1", "rs2", "rs3"];
    const ids = [...exerciseIds, ...regularIds];
    const types = Object.fromEntries(ids.map((id) => [id, id.includes("s") ? "brief_answer" : "single_choice"]));
    const metadata: Record<string, QuestionSelectionMetadata> = Object.fromEntries(ids.map((id) => [id, { origin: id.startsWith("e") ? "end_exercise" : "chapter_content", priority: 2 }]));

    const selected = selectQuestionIds(ids, [], 10, () => 0, types, metadata);

    expect(selected.filter((id) => id.startsWith("e"))).toHaveLength(5);
    expect(selected.filter((id) => types[id] === "brief_answer")).toHaveLength(3);
    expect(selected.filter((id) => types[id] !== "brief_answer")).toHaveLength(7);
  });

  it("stops reserving exercise slots after every end exercise has been attempted", () => {
    const exerciseIds = ["e1", "e2", "e3", "e4", "e5"];
    const regularIds = ["r1", "r2", "r3", "r4", "r5"];
    const ids = [...exerciseIds, ...regularIds];
    const history = exerciseIds.map((questionId) => ({ questionId, attempted: true, latestCorrect: true, due: false }));
    const metadata: Record<string, QuestionSelectionMetadata> = Object.fromEntries(ids.map((id) => [id, { origin: id.startsWith("e") ? "end_exercise" : "chapter_content", priority: 2 }]));

    const selected = selectQuestionIds(ids, history, 5, () => 0, undefined, metadata);

    expect(selected).toEqual(expect.arrayContaining(regularIds));
  });

  it("prefers higher-priority questions within the same learning-history bucket", () => {
    const ids = ["normal-1", "normal-2", "high-1", "high-2"];
    const metadata: Record<string, QuestionSelectionMetadata> = {
      "normal-1": { origin: "chapter_content", priority: 3 },
      "normal-2": { origin: "chapter_content", priority: 3 },
      "high-1": { origin: "chapter_content", priority: 1 },
      "high-2": { origin: "chapter_content", priority: 1 },
    };

    expect(selectQuestionIds(ids, [], 2, () => 0, undefined, metadata)).toEqual(expect.arrayContaining(["high-1", "high-2"]));
  });
});
