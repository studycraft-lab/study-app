import { describe, expect, it } from "vitest";
import shapes from "../../../examples/lesson-packs/synthetic-shapes.json";
import plastids from "../../../examples/lesson-packs/plastids-unverified.json";
import invalid from "../../../examples/lesson-packs/invalid-reference.json";
import { canonicalPackJSON, validateLessonPack } from "./validate";

describe("portable lesson pack validation", () => {
  it.each([shapes, plastids])("accepts structurally valid data without claiming source review", pack => {
    expect(validateLessonPack(pack)).toEqual({ valid: true, pack, errors: [] });
  });
  it("rejects dangling references with a field path", () => {
    expect(validateLessonPack(invalid).errors.join()).toContain("/steps/0/sceneId");
  });
  const invalidCases: [string, (pack: typeof shapes) => unknown, string][] = [
    ["duplicate fact", (p: typeof shapes) => p.facts.push(p.facts[0]), "/facts/1/id"],
    ["missing citations", (p: typeof shapes) => p.facts[0].citationIds = [], "/facts/0/citationIds"],
    ["invalid transition", (p: typeof shapes) => Object.assign(p.steps[0], { nextStepId: "meet-square" }), "/steps/0/nextStepId"],
    ["unsupported primitive", (p: typeof shapes) => p.scenes[0].elements[0].kind = "iframe", "/scenes/0/elements/0"],
    ["executable text", (p: typeof shapes) => p.steps[0].narration = "<script>alert(1)</script>", "/steps/0/narration"],
    ["external resource", (p: typeof shapes) => p.steps[0].narration = "url(https://example.com)", "/steps/0/narration"],
    ["event handler", (p: typeof shapes) => Object.assign(p.scenes[0].elements[0], { onClick: "run()" }), "/scenes/0/elements/0"],
    ["oversized content", (p: typeof shapes) => p.steps[0].narration = "x".repeat(270000), "/"],
    ["unsupported schema", (p: typeof shapes) => p.schemaVersion = "2.0", "/schemaVersion"],
    ["missing action target", (p: typeof shapes) => p.steps[0].actions[0].target = "unknown", "/steps/0/actions/0/target"],
    ["invalid answer key", (p: typeof shapes) => p.steps[0].checkpoint.correctOptionId = "five", "/steps/0/checkpoint/correctOptionId"],
    ["out of section citation", (p: typeof shapes) => p.citations[0].printedPage = "2", "/citations/0/printedPage"],
  ];
  it.each(invalidCases)("rejects %s", (_, mutate, path) => {
    const pack = structuredClone(shapes); mutate(pack);
    const result = validateLessonPack(pack);
    expect(result.valid).toBe(false); expect(result.errors.join()).toContain(path);
  });
  it("rejects cyclic and shared group references", () => {
    const pack = structuredClone(shapes);
    Object.assign(pack.scenes[0].elements[0], { kind: "group", children: ["blue-square"] });
    delete (pack.scenes[0].elements[0] as { width?: number }).width;
    delete (pack.scenes[0].elements[0] as { height?: number }).height;
    expect(validateLessonPack(pack).errors.join()).toContain("Groups cannot nest");
  });
  it("canonicalises object keys without changing pedagogical array order", () => {
    expect(canonicalPackJSON({ b: 1, a: [2, 1] })).toBe(canonicalPackJSON({ a: [2, 1], b: 1 }));
    expect(canonicalPackJSON([1, 2])).not.toBe(canonicalPackJSON([2, 1]));
  });
});
