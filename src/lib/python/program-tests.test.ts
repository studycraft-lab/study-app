import { describe, expect, it } from "vitest";
import { evaluateProgramCase, PROGRAM_TESTS } from "./program-tests";

describe("Python program checks", () => {
  it("rejects a wrong delivery boundary", () => {
    const boundary = PROGRAM_TESTS["q-042"].find((item) => item.name === "Free-delivery boundary")!;
    expect(evaluateProgramCase(boundary, { output: "Bill 200\nDelivery 30\nFinal 230", error: "" })).toBe(false);
  });
  it("rejects a Python error even if earlier output looked correct", () => {
    expect(evaluateProgramCase(PROGRAM_TESTS["q-034"][0], { output: "Odd number", error: "NameError: num is not defined" })).toBe(false);
  });
  it("accepts equivalent wording for a correct branch", () => {
    expect(evaluateProgramCase(PROGRAM_TESTS["q-035"][0], { output: "The largest number is 22", error: "" })).toBe(true);
  });
});
