import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IcsoConceptLesson } from "./icso-concept-lesson";
import { aiRoboticsLesson, networkingLesson } from "./icso-concept-lessons";

function click(name: string) { fireEvent.click(screen.getByRole("button", { name })); }

describe("ICSO concept workbenches", () => {
  afterEach(cleanup);

  it("makes the child connect devices and answer the network check before moving on", () => {
    render(<IcsoConceptLesson lesson={networkingLesson} />);
    expect(screen.getByRole("heading", { name: "Networking & Cyber Safety Lab" })).toBeInTheDocument();
    click("B. Put them on separate desks");
    expect(screen.getByRole("button", { name: "Next action →" })).toBeDisabled();
    click("A. Connect them to a shared network");
    expect(screen.getByText("The network lets both computers reach the shared printer.")).toBeInTheDocument();
    click("Next action →");
    click("B. Files and data");
    click("Answer the quick check →");
    expect(screen.getByRole("heading", { name: "Which is the main purpose of a computer network?" })).toBeInTheDocument();
    click("B. To connect devices and share resources");
    click("Next part →");
    expect(screen.getByRole("heading", { name: "Choose the network size" })).toBeInTheDocument();
  });

  it("distinguishes AI pattern recognition from a fixed timer", () => {
    render(<IcsoConceptLesson lesson={aiRoboticsLesson} />);
    expect(screen.getByRole("heading", { name: "AI & Robotics Mission Lab" })).toBeInTheDocument();
    click("A. A pattern-recognition AI task");
    click("Next action →");
    click("B. No, a fixed rule can do that");
    expect(screen.getByText("A timer can follow a preset rule without AI.")).toBeInTheDocument();
    click("Answer the quick check →");
    click("B. It can make mistakes and should be checked");
    click("Next part →");
    expect(screen.getByRole("heading", { name: "Match the AI domain" })).toBeInTheDocument();
  });

  it("locks a final answer and counts only the first choice", () => {
    const shortLesson = {
      ...networkingLesson,
      missions: [networkingLesson.missions[0]],
      challenge: [{ prompt: "Final network check", options: ["Wrong", "Right", "Other", "None"] as [string, string, string, string], answer: 1, explanation: "This answer is right." }],
    };
    render(<IcsoConceptLesson lesson={shortLesson} />);
    click("A. Connect them to a shared network"); click("Next action →");
    click("B. Files and data"); click("Answer the quick check →");
    click("B. To connect devices and share resources"); click("Start final challenge");
    click("A. Wrong");
    expect(screen.getByRole("button", { name: "B. Right" })).toBeDisabled();
    click("See my result");
    expect(screen.getByText(/You answered 0 of 1 final questions correctly/)).toBeInTheDocument();
  });

  it("lets the child answer on the topology diagram and explains a mistaken shape", () => {
    const shortLesson = { ...networkingLesson, missions: [networkingLesson.missions[2]], challenge: [networkingLesson.challenge[0]] };
    render(<IcsoConceptLesson lesson={shortLesson} />);
    click("Choose ◯ Ring");
    expect(screen.getByText(/A ring connects devices in a closed loop/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next action →" })).toBeDisabled();
    click("Choose ⭐ Star");
    expect(screen.getByText(/each device connects to a central device/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next action →" })).toBeEnabled();
  });

  it("uses a first-attempt quick check and gives a focused end review", () => {
    const shortLesson = {
      ...networkingLesson,
      missions: [networkingLesson.missions[0]],
      challenge: [{ prompt: "Final network check", options: ["Wrong", "Right", "Other", "None"] as [string, string, string, string], answer: 1, explanation: "A network connects devices." }],
    };
    render(<IcsoConceptLesson lesson={shortLesson} />);
    click("A. Connect them to a shared network"); click("Next action →");
    click("B. Files and data"); click("Answer the quick check →");
    click("A. To make every screen identical");
    expect(screen.getByRole("button", { name: "B. To connect devices and share resources" })).toBeDisabled();
    click("Start final challenge");
    click("A. Wrong"); click("See my result");
    expect(screen.getByRole("heading", { name: "Your next practice" })).toBeInTheDocument();
    expect(screen.getByText(/Final question to revisit:/)).toBeInTheDocument();
  });
});
