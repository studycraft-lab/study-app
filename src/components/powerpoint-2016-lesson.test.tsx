import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PowerPoint2016Lesson } from "./powerpoint-2016-lesson";

function clickButton(name: string) { fireEvent.click(screen.getByRole("button", { name })); }
function clickTab(name: string) { fireEvent.click(screen.getByRole("tab", { name })); }
function answerCheck(name: string) { clickButton(name); clickButton("Next mission →"); }

describe("PowerPoint 2016 mission lab", () => {
  afterEach(cleanup);

  it("uses the 2016 picture contextual tab only after inserting a picture", () => {
    render(<PowerPoint2016Lesson />);
    expect(screen.queryByRole("tab", { name: "Picture Tools → Format" })).not.toBeInTheDocument();
    clickTab("Insert"); clickButton("Pictures"); clickButton("Practice picture");
    expect(screen.getByRole("tab", { name: "Picture Tools → Format" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Picture Format" })).not.toBeInTheDocument();
    clickTab("Picture Tools → Format");
    expect(screen.getByRole("button", { name: "Crop" })).toBeInTheDocument();
  });

  it("opens File as Backstage and keeps transitions separate from object animations", () => {
    render(<PowerPoint2016Lesson />);
    clickTab("File");
    expect(screen.getByText("File · Backstage view")).toBeInTheDocument();
    expect(screen.queryByLabelText("File Ribbon tools")).not.toBeInTheDocument();
    clickTab("Transitions");
    expect(screen.getByRole("button", { name: "Fade" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fly In" })).not.toBeInTheDocument();
    clickTab("Animations");
    expect(screen.getByRole("button", { name: "Fly In" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fade" })).not.toBeInTheDocument();
  });

  it("lets a child complete all six practices and start final questions", () => {
    render(<PowerPoint2016Lesson />);
    clickTab("Home"); clickButton("New Slide");
    expect(screen.queryByRole("group", { name: "New Slide choices" })).not.toBeInTheDocument();
    clickButton("Layout"); clickButton("Title and Content");
    answerCheck("B. Ctrl + M");

    clickTab("Insert"); clickButton("Pictures"); clickButton("Practice picture"); clickTab("Picture Tools → Format"); clickButton("Crop");
    answerCheck("A. Picture Tools → Format");

    clickTab("Design"); clickButton("Themes"); clickButton("Blue practice theme");
    answerCheck("C. Design");

    clickTab("Transitions"); clickButton("Fade"); clickButton("Duration"); clickButton("1.5 seconds");
    answerCheck("B. A slide transition");

    clickButton("Select picture"); clickTab("Animations"); clickButton("Fly In"); clickButton("Delay"); clickButton("1 second");
    answerCheck("B. Animation Delay");

    clickTab("View"); clickButton("Slide Sorter"); clickTab("Slide Show"); clickButton("From Beginning");
    clickButton("B. Slide Sorter"); clickButton("Start final questions");

    expect(screen.getByText("FINAL CHECK · 1 OF 5")).toBeInTheDocument();
    expect(screen.getByText("Use what you learned")).toBeInTheDocument();
  });
});
