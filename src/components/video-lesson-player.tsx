"use client";
import { useRef, useState } from "react";
import { videoTime, type VideoPlayback } from "@/lib/tutor/video-types";

export function VideoLessonPlayer({ playback, onRetry }: { playback: VideoPlayback; onRetry: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [failed, setFailed] = useState(false);
  const { lesson } = playback;
  const active = lesson.chapters.findLastIndex(chapter => chapter.start <= time);
  function seek(start: number) {
    if (!video.current) return;
    video.current.currentTime = start;
    setTime(start);
    video.current.focus();
  }
  return <section className="video-lesson" aria-label="Video lesson">
    <header className="tutor-heading"><p className="eyebrow">{lesson.subject} · {lesson.board} · Class {lesson.grade}</p><h1>{lesson.title}</h1><p>{lesson.description}</p><span className="tutor-badge">Video lesson · {videoTime(lesson.duration_seconds)}</span></header>
    <video ref={video} controls playsInline preload="metadata" crossOrigin="anonymous" poster={playback.posterUrl} src={playback.videoUrl} aria-label={`${lesson.title} tutor video`} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onError={() => setFailed(true)}>
      <track src={playback.captionsUrl} kind="captions" srcLang="en" label="English" />
      Your browser does not support video playback.
    </video>
    {failed && <div role="alert" className="notice notice-error"><p>The video could not load. Check your connection, then try again.</p><button type="button" onClick={onRetry}>Reload video</button></div>}
    <p className="video-lesson-tip">Follow the highlighted poem lines and captions. Pause whenever you want more time to think. Use full screen for a closer look.</p>
    <nav className="video-lesson-chapters" aria-label="Jump to a section"><h2>Explore the lesson</h2><ol>{lesson.chapters.map((chapter, index) => <li key={chapter.start}><button type="button" onClick={() => seek(chapter.start)} aria-current={index === active ? "true" : undefined}><span>{videoTime(chapter.start)}</span>{chapter.title}</button></li>)}</ol></nav>
  </section>;
}
