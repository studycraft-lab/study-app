import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IcsoLatestItLesson } from "./icso-latest-it-lesson";
import { latestItChallenge, latestItMissions } from "./icso-latest-it-data";

function click(name: string) { fireEvent.click(screen.getByRole("button", { name })); }

describe("latest IT lesson", () => {
  afterEach(cleanup);

  it("has six short parts, valid choices, dated release facts and an original final challenge", () => {
    expect(latestItMissions).toHaveLength(6);
    expect(latestItChallenge).toHaveLength(6);
    expect(latestItMissions.reduce((total, mission) => total + mission.minutes, 6)).toBeLessThanOrEqual(30);
    expect(latestItMissions[0].note).toContain("10 October 2026");
    for (const mission of latestItMissions) {
      expect(mission.cases.length).toBeGreaterThanOrEqual(3);
      expect([...mission.order].sort()).toEqual(mission.cases.map((_, index) => index));
      for (const item of mission.cases) {
        expect(item.answer).toBeGreaterThanOrEqual(0);
        expect(item.answer).toBeLessThan(mission.bins.length);
        expect(Object.keys(item.wrong)).toHaveLength(mission.bins.length - 1);
      }
      expect(mission.check.answer).toBeLessThan(mission.check.options.length);
    }
    for (const question of latestItChallenge) expect(question.answer).toBeLessThan(question.options.length);
  });

  it("reveals a card and gives a specific correction before allowing progress", () => {
    render(<IcsoLatestItLesson />);
    click("Explore iPhone");
    expect(screen.getByText(/iOS 27 adds child-safety/)).toBeInTheDocument();
    click("Choose iOS · Apple");
    expect(screen.getByRole("status")).toHaveTextContent("iOS belongs to Apple; Android belongs to Google.");
    expect(screen.getByRole("button", { name: "Next clue →" })).toBeDisabled();
    click("Choose Android · Google");
    expect(screen.getByRole("button", { name: "Next clue →" })).toBeEnabled();
  });

  it("locks the first memory-check answer and reaches the final challenge from all six parts", () => {
    render(<IcsoLatestItLesson />);
    latestItMissions.forEach((mission, missionIndex) => {
      mission.order.map(index => mission.cases[index]).forEach(item => {
        click(`Choose ${mission.bins[item.answer]}`);
        click(item === mission.cases[mission.order[mission.order.length - 1]] ? "Try the memory check →" : "Next clue →");
      });
      const answer = mission.check.answer;
      click(`${String.fromCharCode(65 + answer)}. ${mission.check.options[answer]}`);
      expect(screen.getByRole("button", { name: `A. ${mission.check.options[0]}` })).toBeDisabled();
      click(missionIndex === 5 ? "Start final challenge" : "Next part →");
    });
    expect(screen.getByRole("heading", { name: "Spot the important clue" })).toBeInTheDocument();
    latestItChallenge.forEach((question, index) => {
      const choice = index === 0 ? (question.answer + 1) % question.options.length : question.answer;
      click(`${String.fromCharCode(65 + choice)}. ${question.options[choice]}`);
      click(index === latestItChallenge.length - 1 ? "See my result" : "Next question →");
    });
    expect(screen.getByText(/You answered 5 of 6 final questions correctly/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What to revisit" })).toBeInTheDocument();
    click("Practise again");
    expect(screen.getByRole("heading", { name: "Read the operating-system map" })).toBeInTheDocument();
  });
});
