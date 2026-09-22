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
  "q-059": [test("Positive", ["12"], "Positive", ["^positive$"]), test("Negative", ["-4"], "Negative", ["^negative$"]), test("Zero", ["0"], "Zero", ["^zero$"])],
  "q-060": [test("Just below voting age", ["17"], "Not eligible to vote", ["^not eligible to vote$"]), test("Voting age boundary", ["18"], "Eligible to vote", ["^eligible to vote$"]), test("Adult", ["65"], "Eligible to vote", ["^eligible to vote$"])],
  "q-061": [test("Both 5 and 10", ["20"], "Divisible by both", ["^divisible by both$"]), test("Only 5", ["15"], "Divisible by 5 only", ["^divisible by 5 only$"]), test("Neither", ["13"], "Not divisible by 5", ["^not divisible by 5$"])],
  "q-062": [test("First largest", ["9", "4", "2"], "Largest: 9", ["largest"], [9]), test("Second largest", ["3", "11", "5"], "Largest: 11", ["largest"], [11]), test("Equal first and second", ["5", "5", "2"], "Largest: 5", ["largest"], [5]), test("Equal second and third", ["5", "7", "7"], "Largest: 7", ["largest"], [7])],
  "q-063": [test("Divisible by 400", ["2000"], "Leap year", ["^leap year$"]), test("Century not divisible by 400", ["1900"], "Not a leap year", ["^not a leap year$"]), test("Divisible by 4", ["2024"], "Leap year", ["^leap year$"]), test("Common year", ["2023"], "Not a leap year", ["^not a leap year$"])],
  "q-064": [test("Cold upper boundary", ["14"], "Cold", ["^cold$"]), test("Pleasant lower boundary", ["15"], "Pleasant", ["^pleasant$"]), test("Pleasant upper boundary", ["29"], "Pleasant", ["^pleasant$"]), test("Hot lower boundary", ["30"], "Hot", ["^hot$"])],
  "q-065": [test("Below discount boundary", ["999"], "Discount: 0; To pay: 999", ["discount", "to pay"], [0, 999]), test("Discount boundary", ["1000"], "Discount: 100; To pay: 900", ["discount", "to pay"], [100, 900]), test("Above discount boundary", ["1200"], "Discount: 120; To pay: 1080", ["discount", "to pay"], [120, 1080])],
  "q-066": [test("Zero units", ["0"], "Charge: 0", ["charge"], [0]), test("First slab boundary", ["100"], "Charge: 200", ["charge"], [200]), test("Middle slab", ["150"], "Charge: 350", ["charge"], [350]), test("Second slab boundary", ["200"], "Charge: 500", ["charge"], [500]), test("Above second slab", ["230"], "Charge: 650", ["charge"], [650])],
  "q-067": [test("Child", ["11"], "Fare: 50", ["fare"], [50]), test("Adult lower boundary", ["12"], "Fare: 100", ["fare"], [100]), test("Adult upper boundary", ["59"], "Fare: 100", ["fare"], [100]), test("Senior", ["60"], "Fare: 70", ["fare"], [70])],
  "q-068": [test("Both just pass", ["40", "40"], "Pass", ["^pass$"]), test("First fails", ["39", "80"], "Fail", ["^fail$"]), test("Second fails", ["80", "39"], "Fail", ["^fail$"]), test("Both pass", ["80", "80"], "Pass", ["^pass$"])],
  "q-069": [test("Even digit sum", ["28"], "Sum: 10; Even sum", ["sum", "even sum"], [10]), test("Odd digit sum", ["14"], "Sum: 5; Odd sum", ["sum", "odd sum"], [5]), test("Another even sum", ["91"], "Sum: 10; Even sum", ["sum", "even sum"], [10])],
  "q-070": [test("Eight characters", ["abc12345"], "Strong", ["^strong$"]), test("Seven characters", ["abc1234"], "Too short", ["^too short$"]), test("Empty text", [""], "Too short", ["^too short$"])],
  "q-071": [test("Saturday", ["saturday"], "Weekend", ["^weekend$"]), test("Sunday capitalised", ["Sunday"], "Weekend", ["^weekend$"]), test("Monday", ["Monday"], "Weekday", ["^weekday$"])],
  "q-072": [test("Equilateral", ["3", "3", "3"], "Equilateral", ["^equilateral$"]), test("Isosceles", ["3", "3", "4"], "Isosceles", ["^isosceles$"]), test("Scalene", ["3", "4", "5"], "Scalene", ["^scalene$"]), test("Straight line", ["1", "2", "3"], "Not a triangle", ["^not a triangle$"]), test("Zero side", ["0", "4", "4"], "Not a triangle", ["^not a triangle$"])],
  "q-073": [test("First fare boundary", ["5"], "Fare: 10", ["fare"], [10]), test("Middle fare lower boundary", ["6"], "Fare: 20", ["fare"], [20]), test("Middle fare upper boundary", ["10"], "Fare: 20", ["fare"], [20]), test("Highest fare", ["11"], "Fare: 30", ["fare"], [30])],
  "q-074": [test("Below service boundary", ["1000", "4"], "Bonus: 50; Total: 1050", ["bonus", "total"], [50, 1050]), test("Service boundary", ["1000", "5"], "Bonus: 100; Total: 1100", ["bonus", "total"], [100, 1100]), test("Higher salary", ["2000", "7"], "Bonus: 200; Total: 2200", ["bonus", "total"], [200, 2200])],
  "q-075": [test("Below range", ["9"], "Out of range", ["^out of range$"]), test("Lower boundary", ["10"], "In range", ["^in range$"]), test("Upper boundary", ["50"], "In range", ["^in range$"]), test("Above range", ["51"], "Out of range", ["^out of range$"])],
  "q-076": [test("Both multiples", ["15"], "Both", ["^both$"]), test("Only 3", ["9"], "Three", ["^three$"]), test("Only 5", ["10"], "Five", ["^five$"]), test("Neither", ["7"], "Neither", ["^neither$"])],
  "q-077": [test("Add", ["10", "3", "add"], "Result: 13", ["result"], [13]), test("Subtract", ["10", "3", "subtract"], "Result: 7", ["result"], [7]), test("Unknown choice", ["10", "3", "multiply"], "Unknown operation", ["^unknown operation$"])],
  "q-078": [test("Quotient and remainder", ["10", "3"], "Quotient: 3; Remainder: 1", ["quotient", "remainder"], [3, 1]), test("No remainder", ["8", "2"], "Quotient: 4; Remainder: 0", ["quotient", "remainder"], [4, 0]), test("Zero divisor", ["7", "0"], "Cannot divide by zero", ["^cannot divide by zero$"])],
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
