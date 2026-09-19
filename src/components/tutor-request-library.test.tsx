import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ChildTutorLibrary } from "./tutor-request-library";
vi.mock("./app-header", () => ({ AppHeader: () => <header>Child</header> }));
const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); router.push.mockClear(); });
it("offers published lessons directly and explains unavailable and declined requests", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ chapters: [],sections: [],progress: [{ id: "saved",pack_id: "pack",chapter_title: "Shapes",heading: "Squares",completed: false }], lessons: [{ id: "pack",heading: "Squares",chapter_title: "Shapes" }],requests: [{ id: "one",proposed_heading: "Plastids",status: "ready",available: false,pack_id: "archived" },{ id: "two",proposed_heading: "All Biology",status: "declined",reason: "Let's choose one short section.",available: false }] })));
  render(<ChildTutorLibrary />);
  expect(await screen.findByRole("link",{ name: /Resume Squares/ })).toHaveAttribute("href","/study/tutor?resume=saved");
  expect(screen.queryByRole("link", { name: /Learn Squares/ })).not.toBeInTheDocument();
  expect(screen.getByText("Need help with another section?").closest("details")).not.toHaveAttribute("open");
  expect(screen.getByText(/Unavailable — your parent/)).toBeVisible();
  expect(screen.getByText("Let's choose one short section.")).toBeVisible();
  expect(screen.queryByRole("link",{ name: "Start Plastids" })).not.toBeInTheDocument();
});
it("limits lessons and saved progress to the chapter selected from Study", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ chapters: [{ id: "cell", title: "The Cell", courses: { subject: "Biology" } }], sections: [], requests: [], lessons: [{ id: "p", chapter_id: "cell", heading: "Plastids", chapter_title: "The Cell" }, { id: "other", chapter_id: "map", heading: "Maps" }], progress: [{ id: "saved-map", pack_id: "other", chapter_id: "map", heading: "Maps", completed: false }] })));
  render(<ChildTutorLibrary chapterFilter="cell" />);
  expect(await screen.findByRole("link", { name: /Learn Plastids/ })).toBeVisible();
  expect(screen.queryByRole("link", { name: /Maps/ })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Cell");
});
it("offers restart from a completed Plastids lesson card", async () => {
  const library = { chapters: [{ id: "cell", title: "The Cell", courses: { subject: "Biology" } }], sections: [], requests: [], lessons: [], progress: [{ id: "saved-plastids", pack_id: "pack", chapter_id: "cell", chapter_title: "The Cell", heading: "Plastids", completed: true }] };
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(library)).mockResolvedValueOnce(Response.json({ progress: { id: "saved-plastids" } }));
  vi.stubGlobal("fetch", fetch);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<ChildTutorLibrary chapterFilter="cell" />);
  expect(await screen.findByRole("link", { name: /Review Plastids/ })).toBeVisible();
  const restart = screen.getByRole("button", { name: "Restart Plastids" });
  fireEvent.click(restart);
  expect(fetch).toHaveBeenCalledTimes(1);
  confirm.mockReturnValue(true);
  fireEvent.click(restart);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/study/tutor?resume=saved-plastids"));
  expect(fetch).toHaveBeenCalledWith("/api/study/tutor/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ restartId: "saved-plastids" }) });
});
