import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TutorVoiceControls } from "./tutor-voice-controls";
vi.mock("@/lib/tutor/voice/browser", () => ({ BrowserTutorVoice: class { end = vi.fn(); mute = vi.fn(); } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("shows an honest unavailable notice without unusable call controls", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ available: false, reason: "Live tutoring is disabled. Scripted rehearsal is available." })));
  render(<TutorVoiceControls progressId="saved" paused={false} onActivity={vi.fn()} onState={vi.fn()} onMode={vi.fn()} />);
  expect(await screen.findByText("Voice is not available yet.")).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.queryByText(/Voice: idle/)).not.toBeInTheDocument();
});
it("offers only the start action before a supported voice session", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ available: true })));
  render(<TutorVoiceControls progressId="saved" paused={false} onActivity={vi.fn()} onState={vi.fn()} onMode={vi.fn()} />);
  expect(await screen.findByRole("button", { name: "Start live voice" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "End voice" })).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
