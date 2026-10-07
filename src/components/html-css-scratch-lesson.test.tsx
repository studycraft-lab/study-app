import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HtmlCssScratchLesson } from "./html-css-scratch-lesson";

function click(name: string | RegExp) { fireEvent.click(screen.getByRole("button", { name })); }
function finish(answer: string) { click(answer); click("Next part →"); }

describe("HTML, CSS and Scratch lesson", () => {
  afterEach(cleanup);

  it("builds a page, styles it, and runs a correctly ordered Scratch script", () => {
    render(<HtmlCssScratchLesson />);
    click(/^<head>/); click(/^<title>/); click(/^<body>/);
    finish("B. <title> inside <head>");

    click("Add <h1>"); click("Add <p>");
    expect(screen.getByRole("heading", { name: "Our Planet" })).toBeInTheDocument();
    expect(screen.getByText(/<h1>Our Planet<\/h1>/)).toBeInTheDocument();
    finish("B. <p>Hello</p>");

    click("Add <a>"); click("Set href"); click("Add <img>"); click("Set src + alt");
    expect(screen.getByRole("img", { name: "Planet Earth" })).toBeInTheDocument();
    finish("C. href");

    click("Add <style>"); click("Choose h1"); click("color: teal");
    expect(screen.getByText(/h1 \{ color: teal; \}/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Our Planet" })).toHaveStyle({ color: "rgb(0, 128, 128)" });
    finish("A. A <style> element in <head>");

    click(/^Stage/); click(/^Sprite: Cat/); click(/^Blocks palette/); click(/^Script area/);
    finish("C. Script area");

    click(/^Events.*when green flag clicked/); click(/^Control.*repeat \(10\)/); click(/^Motion.*move \(10\) steps/); click("▶ Green flag");
    expect(screen.getByText(/100 steps total/)).toBeInTheDocument();
    click("C. Control"); click("Start final challenge");
    expect(screen.getByText("FINAL CHALLENGE · 1 OF 6")).toBeInTheDocument();
    click("A. <head> — visible paragraph");
    expect(screen.getByRole("button", { name: "B. <title> — browser tab name" })).toBeDisabled();
    click("Next question →");
    click("A. <img src=\"planet.svg\" alt=\"Planet Earth\">"); click("Next question →");
    click("B. h1 { color: teal; }"); click("Next question →");
    click("C. Both 1 and 2"); click("Next question →");
    click("B. Events → Control repeat → Motion move"); click("Next question →");
    click("B. The script stops"); click("See my result");
    expect(screen.getByText(/You answered 5 of 6 final questions correctly/)).toBeInTheDocument();
  });
});
