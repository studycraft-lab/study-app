export type ProgramCase = {
  name: string;
  input: string[];
  expected: string;
  kind?: "syntax";
  patterns?: string[];
  numbers?: number[];
  empty?: boolean;
  time?: [number, number, "am" | "pm"];
};
export type ProgramResult = { output: string; error: string };
const test = (name: string, input: string[], expected: string, patterns: string[] = [], numbers: number[] = []): ProgramCase => ({ name, input, expected, patterns, numbers });

export const PROGRAM_TESTS: Record<string, ProgramCase[]> = {
  "q-031": [test("Matching school", ["NHPS"], "My school", ["my school"]), { name: "Other school", input: ["Other"], expected: "No output", empty: true }],
  "q-032": [{ name: "Two-branch syntax", input: [], expected: "Valid if and else blocks", kind: "syntax" }],
  "q-033": [test("Positive number", ["12"], "Positive", ["positive"]), { name: "Zero", input: ["0"], expected: "No output", empty: true }, { name: "Negative number", input: ["-3"], expected: "No output", empty: true }],
  "q-034": [test("Odd number", ["7"], "Odd number", ["odd"]), test("Even number", ["8"], "Even number", ["even"]), test("Zero", ["0"], "Even number", ["even"])],
  "q-035": [test("Second is greater", ["15", "22"], "22 is greater", ["\\b22\\b", "greater|largest"]), test("First is greater", ["22", "15"], "22 is greater", ["\\b22\\b", "greater|largest"]), test("Equal numbers", ["7", "7"], "Equal numbers", ["equal|same"])],
  "q-036": [test("A boundary", ["90"], "Grade A", ["\\bA\\b"]), test("B boundary", ["75"], "Grade B", ["\\bB\\b"]), test("C boundary", ["40"], "Grade C", ["\\bC\\b"]), test("Below pass", ["39"], "Fail", ["fail"])],
  "q-037": [test("Above 500 litres", ["700", "100"], "600 litres; leakage warning", ["too much|leakage"], [600]), test("Exactly 500 litres", ["600", "100"], "500 litres; normal usage", ["normal"], [500]), test("Below 500 litres", ["550", "100"], "450 litres; normal usage", ["normal"], [450])],
  "q-038": [test("Acute", ["45"], "Acute", ["acute"]), test("Right", ["90"], "Right", ["right"]), test("Obtuse", ["125"], "Obtuse", ["obtuse"])],
  "q-039": [test("Second mark higher", ["8", "9"], "18", [], [18]), test("Equal marks", ["7", "7"], "14", [], [14]), test("First mark higher", ["10", "2"], "20", [], [20])],
  "q-040": [test("Sports", ["sports"], "Major Dhyan Chand Khel Ratna Award", ["major dhyan chand khel ratna"]), test("Cinema", ["cinema"], "Dadasaheb Phalke Award", ["dadasaheb phalke"]), test("Unknown field", ["science"], "Award information not available", ["not available"])],
  "q-041": [test("Spy number", ["22"], "22 is a spy number", ["spy number"], [22]), test("Not a spy number", ["45"], "45 is not a spy number", ["not.*spy number"], [45]), test("Another non-spy number", ["11"], "11 is not a spy number", ["not.*spy number"], [11])],
  "q-042": [test("Paid delivery", ["180"], "Bill 180; delivery 30; final 210", [], [180, 30, 210]), test("Free-delivery boundary", ["200"], "Bill 200; delivery 0; final 200", [], [200, 0, 200]), test("Above boundary", ["250"], "Bill 250; delivery 0; final 250", [], [250, 0, 250])],
  "q-043": [test("Profit", ["100", "140"], "Profit 40", ["profit"], [40]), test("Loss", ["100", "80"], "Loss 20", ["loss"], [20]), test("Equal prices", ["100", "100"], "No profit, no loss", ["no profit.*no loss"])],
  "q-044": [test("Area of radius 7", ["7", "area"], "Area 154", [], [154]), test("Circumference of radius 7", ["7", "circumference"], "Circumference 44", [], [44]), test("Area of radius 3.5", ["3.5", "area"], "Area 38.5", [], [38.5])],
  "q-045": [{ name: "Morning", input: ["10", "30"], expected: "10:30 a.m.", time: [10, 30, "am"] }, { name: "Afternoon", input: ["15", "45"], expected: "3:45 p.m.", time: [3, 45, "pm"] }, { name: "Midnight", input: ["0", "5"], expected: "12:05 a.m.", time: [12, 5, "am"] }, { name: "Noon", input: ["12", "0"], expected: "12:00 p.m.", time: [12, 0, "pm"] }],
};

export function evaluateProgramCase(testCase: ProgramCase, result: ProgramResult) {
  if (result.error.trim()) return false;
  const output = result.output.trim();
  if (testCase.empty) return output === "";
  if (testCase.kind === "syntax") return true;
  if (testCase.patterns?.some((pattern) => !new RegExp(pattern, "i").test(output))) return false;
  if (testCase.time) {
    const match = output.match(/(\d+)\s*:\s*(\d+)\s*([ap])\.?m\.?/i);
    if (!match || Number(match[1]) !== testCase.time[0] || Number(match[2]) !== testCase.time[1] || `${match[3].toLowerCase()}m` !== testCase.time[2]) return false;
  }
  if (testCase.numbers?.length) {
    const actual = (output.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    let cursor = 0;
    for (const expected of testCase.numbers) {
      while (cursor < actual.length && Math.abs(actual[cursor] - expected) > 0.02) cursor++;
      if (cursor >= actual.length) return false;
      cursor++;
    }
  }
  return true;
}
