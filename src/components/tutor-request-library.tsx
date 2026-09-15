"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AvailableLesson, TutorChapter, TutorRequest, TutorSection } from "@/lib/tutor/request-store";
import { AppHeader } from "./app-header";
type Library = { chapters: TutorChapter[]; sections: TutorSection[]; lessons: AvailableLesson[]; requests: TutorRequest[]; progress: { id: string; heading: string; completed: boolean }[] };
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
export function ChildTutorLibrary() {
  const { library, error, busy, act, refresh } = useLibrary(false);
  const [chapterId, setChapter] = useState(""); const [sectionId, setSection] = useState(""); const [heading, setHeading] = useState(""); const [page, setPage] = useState(""); const [note, setNote] = useState("");
  const sections = library?.sections.filter(s => s.chapter_id === chapterId) ?? [];
  return <main className="study-shell"><AppHeader role="child" /><Link href="/study">Back to practice</Link><h1>Tutor a textbook section</h1><p>Your requests and saved progress are private to you. Your parent prepares each lesson.</p>{error && <p role="alert">{error}</p>}<button onClick={refresh}>Refresh status</button>
    {library && <><section><h2>Available lessons</h2>{library.lessons.length ? library.lessons.map(lesson => <p key={lesson.id}><Link href={`/study/tutor?pack=${lesson.id}`}>Learn {lesson.heading}</Link> · {lesson.chapter_title}</p>) : <p>No published lessons yet. Request a section below.</p>}</section>
      {library.progress.length > 0 && <section><h2>Saved lessons</h2>{library.progress.map(p => <p key={p.id}><Link href={`/study/tutor?resume=${p.id}`}>{p.completed ? "Review" : "Resume"} {p.heading}</Link></p>)}</section>}
      <form onSubmit={e => { e.preventDefault(); void act({ chapterId, sectionId: sectionId || null, heading, page, note }); }}><h2>Request help</h2><fieldset disabled={busy}><legend>Choose one section</legend><label>Chapter <select value={chapterId} onChange={e => { setChapter(e.target.value); setSection(""); setHeading(""); }} required><option value="">Choose chapter</option>{library.chapters.map(ch => <option value={ch.id} key={ch.id}>{ch.courses.subject} · {ch.title}</option>)}</select></label>
        <label>Textbook section <select value={sectionId} onChange={e => { setSection(e.target.value); const s = sections.find(s => s.id === e.target.value); setHeading(s?.heading ?? ""); setPage(s?.printed_pages.join(", ") ?? ""); }}><option value="">Propose a heading</option>{sections.map(s => <option key={s.id} value={s.id}>{s.heading}</option>)}</select></label>
        {!sectionId && <label>Heading from your book <input value={heading} onChange={e => setHeading(e.target.value)} maxLength={200} required /></label>}
        <label>Printed page, if known <input value={page} onChange={e => setPage(e.target.value)} maxLength={80} /></label><label>Optional note <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} /></label><button disabled={!chapterId || !heading.trim()}>Request this section</button></fieldset></form>
      <section><h2>Your requests</h2>{library.requests.map(r => <article key={r.id}><h3>{r.proposed_heading}</h3><p>{r.status === "ready" && !r.available ? "Unavailable — your parent needs to publish an eligible lesson for this section." : r.status === "preparing" ? "Your parent is preparing this section." : r.status === "requested" ? "Requested — waiting for your parent." : r.status === "declined" ? r.reason : "Ready to learn."}</p>{r.available && <Link href={`/study/tutor?pack=${r.pack_id}`}>Start {r.proposed_heading}</Link>}</article>)}</section>
    </>}
  </main>;
}
function RequestRow({ request, library, busy, act }: { request: TutorRequest; library: Library; busy: boolean; act: (body: unknown, method?: string) => Promise<void> }) {
  const [sectionId, setSection] = useState(request.section_id ?? ""); const [packId, setPack] = useState(""); const [reason, setReason] = useState("");
  return <article><h3>{request.child_profiles?.display_name}: {request.proposed_heading}</h3><p>{library.chapters.find(c => c.id === request.chapter_id)?.title} · {request.page_reference} · {request.status}</p><p>{request.note}</p>{request.status === "declined" ? <p>{request.reason}</p> : <fieldset disabled={busy}><legend>Prepare this request</legend><label>Exact teaching section <select value={sectionId} onChange={e => setSection(e.target.value)}><option value="">Narrow to a section</option>{library.sections.filter(s => s.chapter_id === request.chapter_id).map(s => <option key={s.id} value={s.id}>{s.heading}</option>)}</select></label><button disabled={!sectionId} onClick={() => void act({ id: request.id, action: "preparing", sectionId, reason: "" }, "PATCH")}>Mark preparing</button>
    <label>Published lesson <select value={packId} onChange={e => setPack(e.target.value)}><option value="">Choose matching lesson</option>{library.lessons.filter(p => p.section_id === request.section_id && p.chapter_id === request.chapter_id).map(p => <option key={p.id} value={p.id}>{p.heading} v{p.content_version}</option>)}</select></label><button disabled={!packId} onClick={() => void act({ id: request.id, action: "ready", packId, reason: "" }, "PATCH")}>Link ready lesson</button>
    <label>Short reason if declining <input maxLength={300} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={!reason.trim()} onClick={() => void act({ id: request.id, action: "decline", reason }, "PATCH")}>Decline request</button></fieldset>}</article>;
}
export function ParentTutorRequests() {
  const { library, error, busy, act, refresh } = useLibrary(true);
  const [chapterId, setChapter] = useState(""); const [key, setKey] = useState(""); const [heading, setHeading] = useState(""); const [pages, setPages] = useState("");
  return <section aria-label="Tutoring requests"><h2>Section requests</h2>{error && <p role="alert">{error}</p>}<button onClick={refresh}>Refresh requests</button>{library && <><form onSubmit={e => { e.preventDefault(); void act({ chapterId, key, heading, pages: pages.split(",").map(p => p.trim()).filter(Boolean) }); }}><fieldset disabled={busy}><legend>Add an exact textbook heading</legend><label>Chapter <select value={chapterId} onChange={e => setChapter(e.target.value)} required><option value="">Choose chapter</option>{library.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.courses.board} · Grade {ch.courses.grade} · {ch.title}</option>)}</select></label><label>Section key for lesson preparation <input value={key} onChange={e => setKey(e.target.value)} pattern="[a-z][a-z0-9_\-]{0,63}" maxLength={64} required placeholder="plastids" /></label><label>Exact heading <input value={heading} onChange={e => setHeading(e.target.value)} maxLength={200} required /></label><label>Printed pages, separated by commas <input value={pages} onChange={e => setPages(e.target.value)} maxLength={300} /></label><button>Add section</button></fieldset></form><p>Map broad requests to one exact section before preparation. Prepare the matching lesson outside StudyCraft, then import and publish it above. The same published lesson can fulfil requests from several children.</p>{library.requests.map(request => <RequestRow key={request.id} request={request} library={library} busy={busy} act={act} />)}</>}</section>;
}
