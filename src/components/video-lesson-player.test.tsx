import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { VideoLessonPlayer } from "./video-lesson-player";
import type { VideoPlayback } from "@/lib/tutor/video-types";
afterEach(cleanup);
const playback: VideoPlayback = { lesson: { id: "video", chapter_id: "poem", chapter_title: "Poem", board: "ICSE", grade: 6, subject: "English Literature", title: "A Little Grain of Gold", description: "Explore the poem.", duration_seconds: 675.4, content_version: 1, status: "published", chapters: [{ title: "Welcome", start: 0 }, { title: "Regret", start: 382.3 }] }, videoUrl: "/video.mp4", posterUrl: "/poster.jpg", captionsUrl: "/captions.vtt" };
it("plays on request and seeks to the selected teaching section", () => {
  render(<VideoLessonPlayer playback={playback} onRetry={vi.fn()} />);
  const video = screen.getByLabelText(/tutor video/) as HTMLVideoElement;
  expect(video).toHaveAttribute("controls"); expect(video).toHaveAttribute("playsinline"); expect(video).not.toHaveAttribute("autoplay");
  expect(video.querySelector("track")).toHaveAttribute("src", "/captions.vtt");
  const regret = screen.getByRole("button", { name: /Regret/ });
  fireEvent.click(regret); expect(video.currentTime).toBe(382.3); expect(regret).toHaveAttribute("aria-current", "true");
  video.currentTime = 15; fireEvent.timeUpdate(video); expect(screen.getByRole("button", { name: /Welcome/ })).toHaveAttribute("aria-current", "true");
});
it("offers an explicit reload after a media error", () => {
  const retry = vi.fn(); render(<VideoLessonPlayer playback={playback} onRetry={retry} />);
  fireEvent.error(screen.getByLabelText(/tutor video/)); fireEvent.click(screen.getByRole("button", { name: "Reload video" })); expect(retry).toHaveBeenCalledOnce();
});
