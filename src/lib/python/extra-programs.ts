// Original practice at the same arithmetic-and-condition level as the supplied programs.
// Replaced exercises use new IDs so saved answers cannot pass a different question.
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
  program("q-079", "Class fundraiser", 5,
    'Accept the number of adult and child tickets sold. Adult tickets cost 50 each and child tickets cost 30 each. Print "Collected:" and the total money. If the total is at least 1000, print "Target reached"; otherwise print "Below target".',
    'adults = int(input("Adult tickets: "))\nchildren = int(input("Child tickets: "))\ncollected = adults * 50 + children * 30\nprint("Collected:", collected)\nif collected >= 1000:\n    print("Target reached")\nelse:\n    print("Below target")',
    "Find the money from each kind of ticket, then add it."),
  program("q-080", "Rectangle area and perimeter", 5,
    'Accept the whole-number length and width of a rectangle. Area = length × width; perimeter = 2 × (length + width). Print "Area:" and "Perimeter:". If the area is at least 100, print "Large plot"; otherwise print "Small plot".',
    'length = int(input("Length: "))\nwidth = int(input("Width: "))\narea = length * width\nperimeter = 2 * (length + width)\nprint("Area:", area)\nprint("Perimeter:", perimeter)\nif area >= 100:\n    print("Large plot")\nelse:\n    print("Small plot")',
    "Calculate both measurements before comparing the area with 100."),
  program("q-081", "Temperature conversion", 5,
    'Accept a whole-number temperature in Celsius. Fahrenheit = Celsius × 9 / 5 + 32. Print "Fahrenheit:" and the result. If the result is at least 86, print "Hot"; otherwise print "Not hot".',
    'celsius = int(input("Celsius: "))\nfahrenheit = celsius * 9 / 5 + 32\nprint("Fahrenheit:", fahrenheit)\nif fahrenheit >= 86:\n    print("Hot")\nelse:\n    print("Not hot")',
    "Convert first, then compare the Fahrenheit result with 86."),
  program("q-082", "Trip budget", 5,
    'Accept a whole-number journey distance in kilometres. Travel costs 12 per kilometre. Print "Cost:" and the total cost. If it is more than 500, print "Over budget"; otherwise print "Within budget".',
    'distance = int(input("Distance: "))\ncost = distance * 12\nprint("Cost:", cost)\nif cost > 500:\n    print("Over budget")\nelse:\n    print("Within budget")',
    "Multiply the distance by 12 before checking the budget."),
  program("q-083", "Canteen order", 7,
    'Accept the number of sandwiches and juice boxes ordered. A sandwich costs 40 and a juice box costs 20. Delivery costs 25 when the subtotal is below 200; otherwise it is free. Print "Subtotal:", "Delivery:", and "Final:" with the amounts.',
    'sandwiches = int(input("Sandwiches: "))\njuices = int(input("Juice boxes: "))\nsubtotal = sandwiches * 40 + juices * 20\nif subtotal < 200:\n    delivery = 25\nelse:\n    delivery = 0\nprint("Subtotal:", subtotal)\nprint("Delivery:", delivery)\nprint("Final:", subtotal + delivery)',
    "Calculate the subtotal from both items before deciding the delivery cost."),
  program("q-065", "Shopping discount", 5,
    'Accept a whole-number bill amount. Give a 10% discount when the bill is at least 1000; otherwise give no discount. Print "Discount:" and "To pay:" with their amounts.',
    'bill = int(input("Bill: "))\nif bill >= 1000:\n    discount = bill * 10 / 100\nelse:\n    discount = 0\nprint("Discount:", discount)\nprint("To pay:", bill - discount)',
    "Calculate the discount first, then subtract it from the bill."),
  program("q-066", "Electricity bill", 7,
    'Accept a non-negative whole number of electricity units. Charge 2 per unit for the first 100 units, 3 per unit for the next 100, and 5 per unit above 200. Print "Charge:" and the total amount.',
    'units = int(input("Units: "))\nif units <= 100:\n    charge = units * 2\nelif units <= 200:\n    charge = 100 * 2 + (units - 100) * 3\nelse:\n    charge = 100 * 2 + 100 * 3 + (units - 200) * 5\nprint("Charge:", charge)',
    "For 230 units, add the cost of the first 100, next 100 and final 30."),
  program("q-084", "Average marks", 5,
    'Accept marks in three tests, each out of 100. Average = (first + second + third) / 3. Print "Average:" and the result. Print "Pass" if the average is at least 40; otherwise print "Fail".',
    'first = int(input("First mark: "))\nsecond = int(input("Second mark: "))\nthird = int(input("Third mark: "))\naverage = (first + second + third) / 3\nprint("Average:", average)\nif average >= 40:\n    print("Pass")\nelse:\n    print("Fail")',
    "Add the three marks before dividing by 3."),
  program("q-085", "Simple interest", 5,
    'Accept a whole-number amount borrowed, yearly interest rate in percent, and years. Interest = amount × rate × years / 100. Print "Interest:" and "To repay:" (amount + interest). If interest is at least 500, print "High interest"; otherwise print "Low interest".',
    'amount = int(input("Amount: "))\nrate = int(input("Rate: "))\nyears = int(input("Years: "))\ninterest = amount * rate * years / 100\nprint("Interest:", interest)\nprint("To repay:", amount + interest)\nif interest >= 500:\n    print("High interest")\nelse:\n    print("Low interest")',
    "Use the given formula, then add interest to the amount borrowed."),
  program("q-086", "Fuel cost", 5,
    'Accept whole litres of fuel and the whole-number price per litre. Cost = litres × price per litre. If cost is at least 1000, subtract 50 from it; otherwise subtract nothing. Print "Cost:", "Discount:", and "To pay:".',
    'litres = int(input("Litres: "))\nprice = int(input("Price per litre: "))\ncost = litres * price\nif cost >= 1000:\n    discount = 50\nelse:\n    discount = 0\nprint("Cost:", cost)\nprint("Discount:", discount)\nprint("To pay:", cost - discount)',
    "Find the cost first, then choose the discount."),
  program("q-087", "Distance left", 4,
    'Accept the whole-number length of a journey and the distance already travelled. The distance left is length minus distance travelled. Print "Left:" and the result. Print "Arrived" if nothing is left; otherwise print "Keep going". Assume the distance travelled is no more than the journey length.',
    'length = int(input("Journey length: "))\ntravelled = int(input("Travelled: "))\nleft = length - travelled\nprint("Left:", left)\nif left == 0:\n    print("Arrived")\nelse:\n    print("Keep going")',
    "Subtract the distance travelled, then check whether the result is zero."),
  program("q-088", "Exam total and grade", 7,
    'Accept marks in three tests, each out of 100. Print "Total:" and their sum, then "Average:" and total / 3. Print "Excellent" for an average of at least 80, "Pass" for at least 40, or "Needs practice" below 40.',
    'first = int(input("First mark: "))\nsecond = int(input("Second mark: "))\nthird = int(input("Third mark: "))\ntotal = first + second + third\naverage = total / 3\nprint("Total:", total)\nprint("Average:", average)\nif average >= 80:\n    print("Excellent")\nelif average >= 40:\n    print("Pass")\nelse:\n    print("Needs practice")',
    "Find the total and average before checking the highest grade boundary first."),
  program("q-069", "Digit sum", 5,
    'Accept a two-digit positive integer. Print "Sum:" and the sum of its digits. Then print "Even sum" or "Odd sum".',
    'num = int(input("Two-digit number: "))\nsum_digits = num // 10 + num % 10\nprint("Sum:", sum_digits)\nif sum_digits % 2 == 0:\n    print("Even sum")\nelse:\n    print("Odd sum")',
    "Use // 10 for the tens digit and % 10 for the ones digit."),
  program("q-089", "Rental cost", 5,
    'Accept whole days of bicycle rental and the whole-number daily rate. Cost = days × rate. For 7 or more days, discount = 10% of cost; otherwise discount = 0. Print "Cost:", "Discount:", and "To pay:" (cost minus discount).',
    'days = int(input("Days: "))\nrate = int(input("Daily rate: "))\ncost = days * rate\nif days >= 7:\n    discount = cost * 10 / 100\nelse:\n    discount = 0\nprint("Cost:", cost)\nprint("Discount:", discount)\nprint("To pay:", cost - discount)',
    "The number of days decides the discount; the rate decides the cost."),
  program("q-090", "Circle fencing", 5,
    'Accept a circle’s whole-number radius, fencing price per metre, and budget. Circumference = 2 × (22 / 7) × radius; cost = circumference × price per metre. Print "Length:" and "Cost:". Print "Over budget" if cost is more than the budget; otherwise print "Within budget".',
    'radius = int(input("Radius: "))\nprice = int(input("Price per metre: "))\nbudget = int(input("Budget: "))\nlength = 2 * (22 / 7) * radius\ncost = length * price\nprint("Length:", length)\nprint("Cost:", cost)\nif cost > budget:\n    print("Over budget")\nelse:\n    print("Within budget")',
    "Calculate the circumference first, then multiply it by the price."),
  program("q-091", "Shop change", 4,
    'Accept an item’s whole-number price and the amount paid. If enough was paid, print "Change:" and paid minus price. Otherwise print "Short by:" and price minus paid.',
    'price = int(input("Price: "))\npaid = int(input("Paid: "))\nif paid >= price:\n    print("Change:", paid - price)\nelse:\n    print("Short by:", price - paid)',
    "Subtract the smaller amount from the larger one in each branch."),
  program("q-074", "Service bonus", 5,
    'Accept a whole-number salary and whole years of service. Give a bonus of 10% of salary for 5 or more years, or 5% otherwise. Print "Bonus:" and "Total:" with their amounts.',
    'salary = int(input("Salary: "))\nyears = int(input("Years: "))\nif years >= 5:\n    bonus = salary * 10 / 100\nelse:\n    bonus = salary * 5 / 100\nprint("Bonus:", bonus)\nprint("Total:", salary + bonus)',
    "Choose the percentage using years of service, then add the bonus."),
  program("q-092", "Savings goal", 4,
    'Accept money already saved, money saved this month, and a savings target. Print "Saved:" and the sum of the first two amounts. If the sum reaches the target, print "Goal reached"; otherwise print "More needed:" and target minus the sum.',
    'already = int(input("Already saved: "))\nthis_month = int(input("Saved this month: "))\ntarget = int(input("Target: "))\nsaved = already + this_month\nprint("Saved:", saved)\nif saved >= target:\n    print("Goal reached")\nelse:\n    print("More needed:", target - saved)',
    "Add the savings before comparing them with the target."),
  program("q-077", "Add or subtract", 5,
    'Accept two integers and a choice of "add" or "subtract" in lowercase. Print "Result:" and the answer, or print "Unknown operation" for another choice.',
    'first = int(input("First: "))\nsecond = int(input("Second: "))\nchoice = input("Operation: ")\nif choice == "add":\n    print("Result:", first + second)\nelif choice == "subtract":\n    print("Result:", first - second)\nelse:\n    print("Unknown operation")',
    "Check the choice before doing the calculation."),
  program("q-078", "Safe division", 5,
    'Accept two non-negative integers. If the second is zero, print "Cannot divide by zero". Otherwise print "Quotient:" using // and "Remainder:" using %.',
    'first = int(input("First: "))\nsecond = int(input("Second: "))\nif second == 0:\n    print("Cannot divide by zero")\nelse:\n    print("Quotient:", first // second)\n    print("Remainder:", first % second)',
    "Only calculate // and % when the second number is not zero."),
];
