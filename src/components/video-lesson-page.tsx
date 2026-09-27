"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "./app-header";
import { VideoLessonPlayer } from "./video-lesson-player";
import type { VideoPlayback } from "@/lib/tutor/video-types";

export function VideoLessonPage({ id, parent = false }: { id: string; parent?: boolean }) {
  const [playback, setPlayback] = useState<VideoPlayback | null>(null);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    setError("");
    try {
      const response = await fetch(`/api/${parent ? "parent" : "study"}/tutor/video?id=${encodeURIComponent(id)}`, { signal });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error ?? "The lesson could not be opened.");
      setPlayback(value); setGeneration(g => g + 1);
    } catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "The lesson could not be opened."); }
  }, [id, parent]);
  useEffect(() => { const controller = new AbortController(); void Promise.resolve().then(() => load(controller.signal)); return () => controller.abort(); }, [load]);
  const back = parent ? "/parent/library/tutor" : playback ? `/study/tutor/library?chapter=${playback.lesson.chapter_id}` : "/study/tutor/library";
  return <main className={`${parent ? "parent-shell" : "study-shell"} tutor-lesson`}><AppHeader role={parent ? "parent" : "child"} /><Link className="tutor-back" href={back}>← Back to lessons</Link>
    {error && <div className="notice notice-error" role="alert"><p>{error}</p><button onClick={() => void load()}>Try again</button></div>}
    {playback ? <VideoLessonPlayer key={`${id}-${generation}`} playback={playback} onRetry={() => void load()} /> : !error && <p role="status">Opening your video lesson…</p>}
  </main>;
}
