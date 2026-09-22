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
  "q-079": [test("Below target", ["10", "10"], "Collected: 800; Below target", ["collected", "below target"], [800]), test("Target boundary", ["14", "10"], "Collected: 1000; Target reached", ["collected", "target reached"], [1000]), test("Above target", ["20", "10"], "Collected: 1300; Target reached", ["collected", "target reached"], [1300])],
  "q-080": [test("Small plot", ["9", "11"], "Area: 99; Perimeter: 40; Small plot", ["area", "perimeter", "small plot"], [99, 40]), test("Area boundary", ["10", "10"], "Area: 100; Perimeter: 40; Large plot", ["area", "perimeter", "large plot"], [100, 40]), test("Large plot", ["12", "10"], "Area: 120; Perimeter: 44; Large plot", ["area", "perimeter", "large plot"], [120, 44])],
  "q-081": [test("Below hot boundary", ["29"], "Fahrenheit: 84.2; Not hot", ["fahrenheit", "not hot"], [84.2]), test("Hot boundary", ["30"], "Fahrenheit: 86; Hot", ["fahrenheit", "hot"], [86]), test("Freezing point", ["0"], "Fahrenheit: 32; Not hot", ["fahrenheit", "not hot"], [32])],
  "q-082": [test("Within budget", ["41"], "Cost: 492; Within budget", ["cost", "within budget"], [492]), test("Over budget", ["42"], "Cost: 504; Over budget", ["cost", "over budget"], [504]), test("No distance", ["0"], "Cost: 0; Within budget", ["cost", "within budget"], [0])],
  "q-083": [test("Paid delivery", ["2", "3"], "Subtotal: 140; Delivery: 25; Final: 165", ["subtotal", "delivery", "final"], [140, 25, 165]), test("Free boundary", ["4", "2"], "Subtotal: 200; Delivery: 0; Final: 200", ["subtotal", "delivery", "final"], [200, 0, 200]), test("Above boundary", ["5", "2"], "Subtotal: 240; Delivery: 0; Final: 240", ["subtotal", "delivery", "final"], [240, 0, 240])],
  "q-065": [test("Below discount boundary", ["999"], "Discount: 0; To pay: 999", ["discount", "to pay"], [0, 999]), test("Discount boundary", ["1000"], "Discount: 100; To pay: 900", ["discount", "to pay"], [100, 900]), test("Above discount boundary", ["1200"], "Discount: 120; To pay: 1080", ["discount", "to pay"], [120, 1080])],
  "q-066": [test("Zero units", ["0"], "Charge: 0", ["charge"], [0]), test("First slab boundary", ["100"], "Charge: 200", ["charge"], [200]), test("Middle slab", ["150"], "Charge: 350", ["charge"], [350]), test("Second slab boundary", ["200"], "Charge: 500", ["charge"], [500]), test("Above second slab", ["230"], "Charge: 650", ["charge"], [650])],
  "q-084": [test("Below pass", ["39", "40", "40"], "Average: 39.67; Fail", ["average", "fail"], [39.6667]), test("Pass boundary", ["40", "40", "40"], "Average: 40; Pass", ["average", "pass"], [40]), test("High average", ["80", "90", "100"], "Average: 90; Pass", ["average", "pass"], [90])],
  "q-085": [test("Low interest", ["1000", "5", "9"], "Interest: 450; To repay: 1450; Low interest", ["interest", "to repay", "low interest"], [450, 1450]), test("Interest boundary", ["1000", "5", "10"], "Interest: 500; To repay: 1500; High interest", ["interest", "to repay", "high interest"], [500, 1500]), test("High interest", ["2000", "4", "8"], "Interest: 640; To repay: 2640; High interest", ["interest", "to repay", "high interest"], [640, 2640])],
  "q-086": [test("Below discount", ["9", "100"], "Cost: 900; Discount: 0; To pay: 900", ["cost", "discount", "to pay"], [900, 0, 900]), test("Discount boundary", ["10", "100"], "Cost: 1000; Discount: 50; To pay: 950", ["cost", "discount", "to pay"], [1000, 50, 950]), test("Above boundary", ["12", "100"], "Cost: 1200; Discount: 50; To pay: 1150", ["cost", "discount", "to pay"], [1200, 50, 1150])],
  "q-087": [test("Journey unfinished", ["50", "20"], "Left: 30; Keep going", ["left", "keep going"], [30]), test("Just arrived", ["50", "50"], "Left: 0; Arrived", ["left", "arrived"], [0]), test("Another unfinished journey", ["20", "19"], "Left: 1; Keep going", ["left", "keep going"], [1])],
  "q-088": [test("Needs practice", ["39", "40", "40"], "Total: 119; Average: 39.67; Needs practice", ["total", "average", "needs practice"], [119, 39.6667]), test("Pass boundary", ["40", "40", "40"], "Total: 120; Average: 40; Pass", ["total", "average", "pass"], [120, 40]), test("Below excellent", ["79", "80", "80"], "Total: 239; Average: 79.67; Pass", ["total", "average", "pass"], [239, 79.6667]), test("Excellent boundary", ["80", "80", "80"], "Total: 240; Average: 80; Excellent", ["total", "average", "excellent"], [240, 80])],
  "q-069": [test("Even digit sum", ["28"], "Sum: 10; Even sum", ["sum", "even sum"], [10]), test("Odd digit sum", ["14"], "Sum: 5; Odd sum", ["sum", "odd sum"], [5]), test("Another even sum", ["91"], "Sum: 10; Even sum", ["sum", "even sum"], [10])],
  "q-089": [test("No discount", ["6", "100"], "Cost: 600; Discount: 0; To pay: 600", ["cost", "discount", "to pay"], [600, 0, 600]), test("Seven-day boundary", ["7", "100"], "Cost: 700; Discount: 70; To pay: 630", ["cost", "discount", "to pay"], [700, 70, 630]), test("Long rental", ["8", "200"], "Cost: 1600; Discount: 160; To pay: 1440", ["cost", "discount", "to pay"], [1600, 160, 1440])],
  "q-090": [test("At budget", ["7", "10", "440"], "Length: 44; Cost: 440; Within budget", ["length", "cost", "within budget"], [44, 440]), test("Over budget", ["7", "10", "439"], "Length: 44; Cost: 440; Over budget", ["length", "cost", "over budget"], [44, 440]), test("Larger circle", ["14", "5", "500"], "Length: 88; Cost: 440; Within budget", ["length", "cost", "within budget"], [88, 440])],
  "q-091": [test("Change due", ["40", "50"], "Change: 10", ["change"], [10]), test("Exact payment", ["40", "40"], "Change: 0", ["change"], [0]), test("Payment short", ["40", "25"], "Short by: 15", ["short by"], [15])],
  "q-074": [test("Below service boundary", ["1000", "4"], "Bonus: 50; Total: 1050", ["bonus", "total"], [50, 1050]), test("Service boundary", ["1000", "5"], "Bonus: 100; Total: 1100", ["bonus", "total"], [100, 1100]), test("Higher salary", ["2000", "7"], "Bonus: 200; Total: 2200", ["bonus", "total"], [200, 2200])],
  "q-092": [test("Below target", ["300", "100", "500"], "Saved: 400; More needed: 100", ["saved", "more needed"], [400, 100]), test("At target", ["300", "200", "500"], "Saved: 500; Goal reached", ["saved", "goal reached"], [500]), test("Above target", ["500", "100", "500"], "Saved: 600; Goal reached", ["saved", "goal reached"], [600])],
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
