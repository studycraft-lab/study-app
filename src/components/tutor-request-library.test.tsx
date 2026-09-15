import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChildTutorLibrary } from "./tutor-request-library";
vi.mock("./app-header", () => ({ AppHeader: () => <header>Child</header> }));
afterEach(cleanup);
it("offers published lessons directly and explains unavailable and declined requests", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ chapters: [],sections: [],progress: [{ id: "saved",heading: "Squares",completed: false }], lessons: [{ id: "pack",heading: "Squares",chapter_title: "Shapes" }],requests: [{ id: "one",proposed_heading: "Plastids",status: "ready",available: false,pack_id: "archived" },{ id: "two",proposed_heading: "All Biology",status: "declined",reason: "Let's choose one short section.",available: false }] })));
  render(<ChildTutorLibrary />);
  expect(await screen.findByRole("link", { name: "Learn Squares" })).toHaveAttribute("href","/study/tutor?pack=pack");
  expect(screen.getByRole("link",{ name: "Resume Squares" })).toHaveAttribute("href","/study/tutor?resume=saved");
  expect(screen.getByText(/Unavailable — your parent/)).toBeVisible();
  expect(screen.getByText("Let's choose one short section.")).toBeVisible();
  expect(screen.queryByRole("link",{ name: "Start Plastids" })).not.toBeInTheDocument();
});
