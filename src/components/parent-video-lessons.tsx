"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { videoTime, type VideoLesson } from "@/lib/tutor/video-types";

export function ParentVideoLessons() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/parent/tutor/video");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Video lessons could not be loaded.");
    setVideos(body.videos ?? []);
  }, []);
  useEffect(() => { void Promise.resolve().then(load).catch(e => setError(e.message)); }, [load]);
  async function publish(lesson: VideoLesson) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/parent/tutor/video", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: lesson.id, status: lesson.status === "published" ? "archived" : "published" }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not update the video.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the video."); }
    finally { setBusy(false); }
  }
  if (!videos.length && !error) return null;
  return <section className="parent-tutor-panel" aria-label="Video lessons"><h2>Video lessons</h2>{error && <p role="alert">{error}</p>}<div className="parent-lesson-grid">{videos.map(lesson => <article className="parent-lesson-card" key={lesson.id}>
    <span className="tutor-badge">{lesson.status === "published" ? "Published" : lesson.status === "draft" ? "Draft" : "Hidden"} · {videoTime(lesson.duration_seconds)}</span>
    <p className="eyebrow">{lesson.subject} · {lesson.board} · Class {lesson.grade}</p><h3>{lesson.title}</h3><p>{lesson.description}</p>
    <div className="button-row"><Link className="tutor-primary" href={`/parent/library/tutor/video/${lesson.id}`}>Preview {lesson.title}</Link><button className="button-quiet" disabled={busy} onClick={() => void publish(lesson)}>{lesson.status === "published" ? "Hide from children" : "Publish for children"}</button></div>
  </article>)}</div></section>;
}
