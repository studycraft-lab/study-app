import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import pack from "../../examples/lesson-packs/synthetic-shapes.json";
import { ParentTutorLibrary } from "./parent-tutor-library";
vi.mock("./tutor-voice-controls", () => ({ ParentVoicePermission: () => null }));
vi.mock("./tutor-request-library", () => ({ ParentTutorRequests: () => null }));
vi.mock("./app-header", () => ({ AppHeader: () => <header>Parent</header> }));
afterEach(cleanup);
let previewed = false;
beforeEach(() => {
  previewed = false;
  vi.stubGlobal("fetch", vi.fn(async (_url: string, options?: RequestInit) => {
    if (options?.method === "PATCH") { previewed = true; return Response.json({ updated: true }); }
    return Response.json({ chapters: [], packs: [{ id: "pack", heading: "Squares", chapter_title: "Shapes", content_version: 1, status: "draft", previewed_at: previewed ? "now" : null, payload: pack }] });
  }));
});
it("requires preview before publication and accurately labels the free scripted preview", async () => {
  render(<ParentTutorLibrary />);
  expect(await screen.findByRole("button", { name: "Publish Squares v1" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Preview Squares v1" }));
  expect(await screen.findByRole("region", { name: "Scripted lesson preview" })).toHaveTextContent("No voice API is used");
  expect(screen.getByRole("img", { name: pack.scenes[0].label })).toBeVisible();
  expect(screen.getByLabelText("Tutor caption")).toHaveTextContent(pack.steps[0].narration);
  await waitFor(() => expect(screen.getByRole("button", { name: "Publish Squares v1" })).toBeEnabled());
});
it("reports unauthorized reads without exposing content", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ error: "Parent sign-in required." }, { status: 401 }));
  render(<ParentTutorLibrary />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Parent sign-in required");
  expect(screen.queryByRole("button", { name: /Publish/ })).not.toBeInTheDocument();
});
