// Additional practice inspired by the difficulty and topics of the existing bank.
// These are original exercises, not questions transcribed from the source PDFs.
export type ExtraProgram = {
  id: string;
  title: string;
  type: "multi_point";
  topicIds: string[];
  marks: number;
  prompt: string;
  response: { editor: "python" };
  answer: { ideal: string };
  hint: string;
  explanation: string;
};

function program(id: string, title: string, marks: number, prompt: string, ideal: string, hint: string): ExtraProgram {
  return { id, title, type: "multi_point", topicIds: ["programs"], marks, prompt, response: { editor: "python" }, answer: { ideal }, hint, explanation: "Check each boundary and branch with more than one input." };
}

export const EXTRA_PROGRAMS: ExtraProgram[] = [
  program("q-059", "Number sign", 3,
    'Accept an integer. Print "Positive", "Negative", or "Zero".',
    'num = int(input("Number: "))\nif num > 0:\n    print("Positive")\nelif num < 0:\n    print("Negative")\nelse:\n    print("Zero")',
    "Compare the number with zero in both directions."),
  program("q-060", "Voting age", 3,
    'Accept a person’s age. Print "Eligible to vote" if the age is at least 18; otherwise print "Not eligible to vote".',
    'age = int(input("Age: "))\nif age >= 18:\n    print("Eligible to vote")\nelse:\n    print("Not eligible to vote")',
    "Check what happens at exactly 18."),
  program("q-061", "Divisible by 5 and 10", 4,
    'Accept a positive integer. Print "Divisible by both" if it is divisible by 5 and 10, "Divisible by 5 only" if it is divisible by 5 but not 10, or "Not divisible by 5" otherwise.',
    'num = int(input("Number: "))\nif num % 10 == 0:\n    print("Divisible by both")\nelif num % 5 == 0:\n    print("Divisible by 5 only")\nelse:\n    print("Not divisible by 5")',
    "Use % to find a remainder. Check the narrower case first."),
  program("q-062", "Largest of three", 5,
    'Accept three integers and print "Largest:" followed by the largest value. Your program should work when two values are equal.',
    'a = int(input("First: "))\nb = int(input("Second: "))\nc = int(input("Third: "))\nif a >= b and a >= c:\n    largest = a\nelif b >= a and b >= c:\n    largest = b\nelse:\n    largest = c\nprint("Largest:", largest)',
    "A value is largest when it is at least as large as both others."),
  program("q-063", "Leap year", 7,
    'Accept a year. Print "Leap year" if it is divisible by 400, or divisible by 4 but not by 100. Otherwise print "Not a leap year".',
    'year = int(input("Year: "))\nif year % 400 == 0 or (year % 4 == 0 and year % 100 != 0):\n    print("Leap year")\nelse:\n    print("Not a leap year")',
    "Years ending in 00 need the special divisible-by-400 check."),
  program("q-064", "Temperature category", 4,
    'Accept a whole-number temperature in degrees Celsius. Print "Cold" below 15, "Pleasant" from 15 to 29, or "Hot" at 30 or above.',
    'temperature = int(input("Temperature: "))\nif temperature < 15:\n    print("Cold")\nelif temperature < 30:\n    print("Pleasant")\nelse:\n    print("Hot")',
    "Try the boundary temperatures 14, 15, 29 and 30."),
  program("q-065", "Shopping discount", 5,
    'Accept a whole-number bill amount. Give a 10% discount when the bill is at least 1000; otherwise give no discount. Print "Discount:" and "To pay:" with their amounts.',
    'bill = int(input("Bill: "))\nif bill >= 1000:\n    discount = bill * 10 / 100\nelse:\n    discount = 0\nprint("Discount:", discount)\nprint("To pay:", bill - discount)',
    "Calculate the discount first, then subtract it from the bill."),
  program("q-066", "Electricity bill", 7,
    'Accept a non-negative whole number of electricity units. Charge 2 per unit for the first 100 units, 3 per unit for the next 100, and 5 per unit above 200. Print "Charge:" and the total amount.',
    'units = int(input("Units: "))\nif units <= 100:\n    charge = units * 2\nelif units <= 200:\n    charge = 100 * 2 + (units - 100) * 3\nelse:\n    charge = 100 * 2 + 100 * 3 + (units - 200) * 5\nprint("Charge:", charge)',
    "For 230 units, add the cost of the first 100, next 100 and final 30."),
  program("q-067", "Ticket fare", 5,
    'Accept a passenger’s age. A normal ticket costs 100. A child under 12 pays 50; a senior aged 60 or more pays 70. Print "Fare:" and the amount.',
    'age = int(input("Age: "))\nif age < 12:\n    fare = 50\nelif age >= 60:\n    fare = 70\nelse:\n    fare = 100\nprint("Fare:", fare)',
    "Check ages 11, 12, 59 and 60."),
  program("q-068", "Pass both subjects", 4,
    'Accept marks in two subjects. Print "Pass" only when both marks are at least 40; otherwise print "Fail".',
    'first = int(input("First mark: "))\nsecond = int(input("Second mark: "))\nif first >= 40 and second >= 40:\n    print("Pass")\nelse:\n    print("Fail")',
    "Use and because both conditions must be true."),
  program("q-069", "Digit sum", 5,
    'Accept a two-digit positive integer. Print "Sum:" and the sum of its digits. Then print "Even sum" or "Odd sum".',
    'num = int(input("Two-digit number: "))\nsum_digits = num // 10 + num % 10\nprint("Sum:", sum_digits)\nif sum_digits % 2 == 0:\n    print("Even sum")\nelse:\n    print("Odd sum")',
    "Use // 10 for the tens digit and % 10 for the ones digit."),
  program("q-070", "Password length", 3,
    'Accept a password as text. Print "Strong" if it has at least 8 characters; otherwise print "Too short".',
    'password = input("Password: ")\nif len(password) >= 8:\n    print("Strong")\nelse:\n    print("Too short")',
    "len(text) counts its characters."),
  program("q-071", "Weekend or weekday", 3,
    'Accept the name of a day. Print "Weekend" for Saturday or Sunday, and "Weekday" for any other day. Accept capital or small letters.',
    'day = input("Day: ").lower()\nif day == "saturday" or day == "sunday":\n    print("Weekend")\nelse:\n    print("Weekday")',
    "Convert the input to lower case before comparing."),
  program("q-072", "Triangle type", 7,
    'Accept three integer side lengths. If they cannot form a triangle, print "Not a triangle". Otherwise print "Equilateral", "Isosceles", or "Scalene".',
    'a = int(input("First side: "))\nb = int(input("Second side: "))\nc = int(input("Third side: "))\nif a <= 0 or b <= 0 or c <= 0 or a + b <= c or a + c <= b or b + c <= a:\n    print("Not a triangle")\nelif a == b and b == c:\n    print("Equilateral")\nelif a == b or b == c or a == c:\n    print("Isosceles")\nelse:\n    print("Scalene")',
    "Check that the sides form a triangle before checking equality."),
  program("q-073", "Bus fare", 4,
    'Accept a positive whole-number distance in kilometres. Print "Fare: 10" for up to 5 km, "Fare: 20" for 6–10 km, or "Fare: 30" for more than 10 km.',
    'distance = int(input("Distance: "))\nif distance <= 5:\n    fare = 10\nelif distance <= 10:\n    fare = 20\nelse:\n    fare = 30\nprint("Fare:", fare)',
    "A distance of exactly 5 or 10 belongs to the lower fare band."),
  program("q-074", "Service bonus", 5,
    'Accept a whole-number salary and whole years of service. Give a bonus of 10% of salary for 5 or more years, or 5% otherwise. Print "Bonus:" and "Total:" with their amounts.',
    'salary = int(input("Salary: "))\nyears = int(input("Years: "))\nif years >= 5:\n    bonus = salary * 10 / 100\nelse:\n    bonus = salary * 5 / 100\nprint("Bonus:", bonus)\nprint("Total:", salary + bonus)',
    "Choose the percentage using years of service, then add the bonus."),
  program("q-075", "Number in range", 3,
    'Accept an integer. Print "In range" if it is from 10 to 50 inclusive; otherwise print "Out of range".',
    'num = int(input("Number: "))\nif num >= 10 and num <= 50:\n    print("In range")\nelse:\n    print("Out of range")',
    "Both 10 and 50 should count as inside the range."),
  program("q-076", "Multiples of 3 and 5", 5,
    'Accept a positive integer. Print "Both" if it is divisible by 3 and 5, "Three" if only by 3, "Five" if only by 5, or "Neither" otherwise.',
    'num = int(input("Number: "))\nif num % 3 == 0 and num % 5 == 0:\n    print("Both")\nelif num % 3 == 0:\n    print("Three")\nelif num % 5 == 0:\n    print("Five")\nelse:\n    print("Neither")',
    "Test divisibility by both numbers before testing either one alone."),
  program("q-077", "Add or subtract", 5,
    'Accept two integers and a choice of "add" or "subtract". Print "Result:" and the answer, or print "Unknown operation" for another choice.',
    'first = int(input("First: "))\nsecond = int(input("Second: "))\nchoice = input("Operation: ").lower()\nif choice == "add":\n    print("Result:", first + second)\nelif choice == "subtract":\n    print("Result:", first - second)\nelse:\n    print("Unknown operation")',
    "Check the choice before doing the calculation."),
  program("q-078", "Safe division", 5,
    'Accept two non-negative integers. If the second is zero, print "Cannot divide by zero". Otherwise print "Quotient:" using // and "Remainder:" using %.',
    'first = int(input("First: "))\nsecond = int(input("Second: "))\nif second == 0:\n    print("Cannot divide by zero")\nelse:\n    print("Quotient:", first // second)\n    print("Remainder:", first % second)',
    "Only calculate // and % when the second number is not zero."),
];
