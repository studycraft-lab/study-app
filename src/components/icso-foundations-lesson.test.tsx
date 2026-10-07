import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IcsoFoundationsLesson } from "./icso-foundations-lesson";
import { fundamentalsLesson, memoryLesson } from "./icso-foundations-data";

function click(name: string) { fireEvent.click(screen.getByRole("button", { name })); }

describe("ICSO foundations workbenches", () => {
  afterEach(cleanup);

  it("keeps both six-part lessons within the planned half hour and every answer in range", () => {
    for (const lesson of [fundamentalsLesson, memoryLesson]) {
      expect(lesson.missions).toHaveLength(6);
      expect(lesson.challenge).toHaveLength(6);
      expect(lesson.missions.reduce((sum, mission) => sum + mission.minutes, 6)).toBeLessThanOrEqual(30);
      for (const mission of lesson.missions) {
        expect(mission.cases).toHaveLength(3);
        for (const item of mission.cases) expect(item.answer).toBeGreaterThanOrEqual(0);
        for (const item of mission.cases) expect(item.answer).toBeLessThan(mission.bins.length);
        expect(mission.check.answer).toBeGreaterThanOrEqual(0);
        expect(mission.check.answer).toBeLessThan(mission.check.options.length);
      }
      for (const question of lesson.challenge) {
        expect(question.answer).toBeGreaterThanOrEqual(0);
        expect(question.answer).toBeLessThan(question.options.length);
      }
    }
  });

  it("shows RAM being cleared by power-off while saved storage and startup code persist", () => {
    render(<IcsoFoundationsLesson lesson={memoryLesson} />);
    expect(screen.getByText("RAM: unsaved edit")).toBeInTheDocument();
    click("Turn power off");
    expect(screen.getByText("RAM: empty")).toBeInTheDocument();
    expect(screen.getByText("ROM: startup code")).toBeInTheDocument();
    expect(screen.getByText("SSD: saved photo")).toBeInTheDocument();
    click("Turn power on");
    expect(screen.getByText("RAM: empty")).toBeInTheDocument();
    click("Place in Drive · saved");
    expect(screen.getByRole("button", { name: "Place next item →" })).toBeDisabled();
    click("Place in RAM · working");
    expect(screen.getByText("RAM holds working data while the computer is on.")).toBeInTheDocument();
    click("Place next item →");
    expect(screen.getAllByText("📝 Unsaved edit")).toHaveLength(2);
  });

  it("uses an actual sorting board for the language-level mission", () => {
    const shortLesson = { ...fundamentalsLesson, missions: [fundamentalsLesson.missions[4]] };
    render(<IcsoFoundationsLesson lesson={shortLesson} />);
    click("Place in Assembly");
    expect(screen.getByRole("button", { name: "Place next item →" })).toBeDisabled();
    click("Place in Machine code");
    expect(screen.getByText("Machine instructions are represented as binary bits.")).toBeInTheDocument();
    click("Place next item →");
    expect(screen.getAllByText("10100110 00001011")).toHaveLength(2);
  });

  it("locks first-attempt checks and lists a topic to revisit after the final question", () => {
    const shortLesson = {
      ...memoryLesson,
      missions: [memoryLesson.missions[0]],
      challenge: [memoryLesson.challenge[0]],
    };
    render(<IcsoFoundationsLesson lesson={shortLesson} />);
    click("Place in RAM · working"); click("Place next item →");
    click("Place in ROM · startup"); click("Place next item →");
    click("Place in Drive · saved"); click("Answer the quick check →");
    click("B. Startup firmware");
    expect(screen.getByRole("button", { name: "A. The unsaved edit in RAM" })).toBeDisabled();
    click("Start final challenge");
    click("B. ROM"); click("See my result");
    expect(screen.getByRole("heading", { name: "Your next practice" })).toBeInTheDocument();
    expect(screen.getByText(/You answered 0 of 1 final questions correctly/)).toBeInTheDocument();
  });
});
