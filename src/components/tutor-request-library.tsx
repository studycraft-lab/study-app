"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AvailableLesson, TutorChapter, TutorRequest, TutorSection } from "@/lib/tutor/request-store";
import { AppHeader } from "./app-header";
type Library = { chapters: TutorChapter[]; sections: TutorSection[]; lessons: AvailableLesson[]; requests: TutorRequest[]; progress: { id: string; pack_id: string; chapter_id: string; chapter_title: string; heading: string; completed: boolean }[] };
function useLibrary(parent: boolean) {
  const endpoint = parent ? "/api/parent/tutor/requests" : "/api/study/tutor/library";
  const [library, setLibrary] = useState<Library | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const response = await fetch(endpoint); const data = await response.json(); if (!response.ok) throw new Error(data.error); setLibrary(data); setError(""); }, [endpoint]);
  useEffect(() => { void Promise.resolve().then(load).catch(e => setError(e.message)); const timer = setInterval(() => { if (document.visibilityState === "visible") void load().catch(e => setError(e.message)); }, 30000); return () => clearInterval(timer); }, [load]);
  async function act(body: unknown, method = "POST") {
    setBusy(true); setError("");
    try { const response = await fetch(endpoint, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update requests."); }
    finally { setBusy(false); }
  }
  return { library, error, busy, act, refresh: () => void load().catch(e => setError(e.message)) };
}
export function ChildTutorLibrary({ chapterFilter }: { chapterFilter?: string }) {
  const { library, error, busy, act } = useLibrary(false);
  const [chapterId, setChapter] = useState(chapterFilter ?? ""); const [sectionId, setSection] = useState(""); const [heading, setHeading] = useState(""); const [page, setPage] = useState(""); const [note, setNote] = useState("");
  const selectedChapter = library?.chapters.find(ch => ch.id === chapterFilter);
  const visibleLessons = library?.lessons.filter(l => !chapterFilter || l.chapter_id === chapterFilter) ?? [];
  const visibleProgress = library?.progress.filter(p => !chapterFilter || p.chapter_id === chapterFilter) ?? [];
  const visibleRequests = library?.requests.filter(r => !chapterFilter || r.chapter_id === chapterFilter) ?? [];
  const sections = library?.sections.filter(s => s.chapter_id === chapterId) ?? [];
  return <main className="study-shell tutor-library"><AppHeader role="child" /><Link className="tutor-back" href="/study">← Back to study</Link>
    <header className="tutor-heading"><p className="eyebrow">{selectedChapter?.courses.subject ?? "One step at a time"}</p><h1>{selectedChapter?.title ?? "Your lessons"}</h1><p>Choose a lesson. We’ll save your place as you go.</p></header>
    {error && <p role="alert">{error}</p>}
    {!library && !error && <p role="status">Loading your lessons…</p>}
    {library && <>
      {!chapterFilter && <nav className="tutor-chapter-index" aria-label="Browse tutoring chapters">{[...new Set(library.chapters.map(ch => ch.courses.subject))].map(subject => <section key={subject}><h2>{subject}</h2>{library.chapters.filter(ch => ch.courses.subject === subject).map(ch => <Link key={ch.id} href={`/study/tutor/library?chapter=${ch.id}`}>{ch.title} →</Link>)}</section>)}</nav>}
      {(chapterFilter || !library.chapters.length) && <section className="tutor-cards" aria-label="Your lessons">
        {visibleProgress.map(p => <article className="tutor-lesson-card" key={p.id}><span className="tutor-badge">{p.completed ? "Completed" : "In progress"}</span><p className="eyebrow">{p.chapter_title}</p><h2>{p.heading}</h2><p>{p.completed ? "Revisit what you learned." : "Pick up where you left off."}</p><Link className="tutor-primary" href={`/study/tutor?resume=${p.id}`}>{p.completed ? "Review" : "Resume"} {p.heading} →</Link></article>)}
        {visibleLessons.filter(lesson => !visibleProgress.some(p => p.pack_id === lesson.id)).map(lesson => <article className="tutor-lesson-card" key={lesson.id}><span className="tutor-badge">Ready to start</span><p className="eyebrow">{lesson.chapter_title}</p><h2>{lesson.heading}</h2><p>Learn with diagrams and short questions.</p><Link className="tutor-primary" href={`/study/tutor?pack=${lesson.id}`}>Learn {lesson.heading} →</Link></article>)}
        {!visibleLessons.length && !visibleProgress.length && <div className="tutor-lesson-card"><h2>Your first lesson is on its way</h2><p>Your parent can add a lesson, or you can request a section below.</p></div>}
      </section>}
      <details className="tutor-request-panel"><summary>Need help with another section?</summary><p>Send your parent the chapter and heading you’d like to learn.</p>
      <form onSubmit={e => { e.preventDefault(); void act({ chapterId, sectionId: sectionId || null, heading, page, note }); }}><fieldset disabled={busy}><legend>Request a lesson</legend><label>Chapter<select value={chapterId} onChange={e => { setChapter(e.target.value); setSection(""); setHeading(""); setPage(""); }} required><option value="">Choose a chapter</option>{library.chapters.map(ch => <option value={ch.id} key={ch.id}>{ch.courses.subject} · {ch.title}</option>)}</select></label>
        {chapterId && <><label>Section<select value={sectionId} onChange={e => { setSection(e.target.value); const s = sections.find(s => s.id === e.target.value); setHeading(s?.heading ?? ""); setPage(s?.printed_pages.join(", ") ?? ""); }}><option value="">Enter a heading from my book</option>{sections.map(s => <option key={s.id} value={s.id}>{s.heading}</option>)}</select></label>
        {!sectionId && <label>Heading from your book<input value={heading} onChange={e => setHeading(e.target.value)} maxLength={200} required /></label>}
        <label>Page number (optional)<input value={page} onChange={e => setPage(e.target.value)} maxLength={80} /></label><label>Anything else? (optional)<input value={note} onChange={e => setNote(e.target.value)} maxLength={300} /></label></>}
        <button className="tutor-primary" disabled={!chapterId || !heading.trim()}>{busy ? "Sending…" : "Send request"}</button></fieldset></form></details>
      {visibleRequests.length > 0 && <section className="tutor-requests"><h2>Your requests</h2>{visibleRequests.map(r => <article className="tutor-request-card" key={r.id}><h3>{r.proposed_heading}</h3><p>{r.status === "ready" && !r.available ? "Unavailable — your parent needs to publish an eligible lesson for this section." : r.status === "preparing" ? "Your parent is preparing this lesson." : r.status === "requested" ? "Sent to your parent." : r.status === "declined" ? r.reason : "Ready to learn."}</p>{r.available && <Link href={`/study/tutor?pack=${r.pack_id}`}>Start {r.proposed_heading}</Link>}</article>)}</section>}
    </>}
  </main>;
}
