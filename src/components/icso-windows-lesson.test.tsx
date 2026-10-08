import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IcsoWindowsLesson } from "./icso-windows-lesson";
import { windowsChallenge, windowsMissions } from "./icso-windows-data";

function click(name: string) { fireEvent.click(screen.getByRole("button", { name })); }

describe("Windows 11 practice desktop", () => {
  afterEach(cleanup);

  it("fits the planned half hour and has valid answers", () => {
    expect(windowsMissions).toHaveLength(6);
    expect(windowsChallenge).toHaveLength(6);
    expect(windowsMissions.reduce((sum, mission) => sum + mission.minutes, 6)).toBeLessThanOrEqual(30);
    for (const question of [...windowsMissions.map(mission => mission.check), ...windowsChallenge]) {
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.options.length);
    }
  });

  it("requires the Start → Search → File Explorer path and locks the quick check", () => {
    render(<IcsoWindowsLesson />);
    click("☀ Widgets");
    expect(screen.getByRole("status")).toHaveTextContent("Try the highlighted action");
    click("⊞ Start");
    click("Search apps and files");
    click("File Explorer");
    expect(screen.getByText("📁 File Explorer · Home")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^B\. Only at the top/ }));
    expect(screen.getByRole("button", { name: /^A\. Centered along the bottom/ })).toBeDisabled();
    click("Next part →");
    expect(screen.getByRole("heading", { name: "Snap two windows" })).toBeInTheDocument();
  });

  it("offers the maximize flyout, then Snap Assist to fill the second side", () => {
    render(<IcsoWindowsLesson />);
    click("⊞ Start"); click("Search apps and files"); click("File Explorer");
    fireEvent.click(screen.getByRole("button", { name: /^A\. Centered along the bottom/ })); click("Next part →");
    click("□ Maximize / Snap");
    click("▥ Three columns");
    expect(screen.getByRole("status")).toHaveTextContent("Try the highlighted action");
    click("▣ Two columns");
    click("📝 Notes");
    expect(screen.getByText("Snap Assist · Fill the open side")).toBeInTheDocument();
    expect(screen.getAllByText("Study page", { selector: "span" }).length).toBeGreaterThan(1);
  });

  it("completes every desktop path and reaches the final challenge", () => {
    render(<IcsoWindowsLesson />);
    const paths = [
      ["⊞ Start", "Search apps and files", "File Explorer"],
      ["□ Maximize / Snap", "▣ Two columns", "📝 Notes"],
      ["☀ Widgets", "☀ Weather · 24°C"],
      ["▣ Task View", "+ New desktop", "Desktop 2"],
      ["Right-click desktop", "Personalize", "Background", "Solid color"],
      ["⊞ Win + E", "⊞ Win + I", "⊞ Win + D"],
    ];
    paths.forEach((path, missionIndex) => {
      path.forEach(click);
      const question = windowsMissions[missionIndex].check;
      const answer = question.answer;
      click(`${String.fromCharCode(65 + answer)}. ${question.options[answer]}`);
      click(missionIndex === 5 ? "Start final challenge" : "Next part →");
    });
    expect(screen.getByRole("heading", { name: "Use what you learned" })).toBeInTheDocument();
  });
});
