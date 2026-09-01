"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Child = { id: string; displayName: string; board: string; grade: number; active: boolean };
type Workspace = { family: { name: string }; parent: { displayName: string }; children: Child[] };

export function ParentFamily() {
  const [passphrase, setPassphrase] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [draft, setDraft] = useState({ displayName: "", board: "ICSE", grade: 6, pin: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const headers = { "content-type": "application/json", "x-studycraft-parent-passphrase": passphrase };

  async function load() {
    setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/parent/family", { headers: { "x-studycraft-parent-passphrase": passphrase } });
    const body = await response.json();
    if (response.ok) setWorkspace(body); else setError(body.error ?? "Could not open the family workspace.");
    setBusy(false);
  }

  async function addChild(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const response = await fetch("/api/parent/children", { method: "POST", headers, body: JSON.stringify(draft) });
    const body = await response.json();
    if (response.ok) { setDraft({ displayName: "", board: "ICSE", grade: 6, pin: "" }); setMessage(`${body.child.displayName} is ready to study.`); await load(); }
    else setError(body.error ?? "Could not add this child.");
    setBusy(false);
  }

  return <main className="parent-shell">
    <header className="parent-header"><Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link><nav className="parent-links"><Link href="/parent/library">Content library</Link><Link href="/study">Child study</Link></nav></header>
    <section className="parent-intro"><p className="eyebrow">Parent workspace</p><h1>Family profiles</h1><p>Add each child once. Their board and grade determine which family chapters appear when they study.</p></section>

    {!workspace ? <section className="import-card family-unlock"><h2>Parent sign-in</h2><label>Parent passphrase<input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label><button onClick={load} disabled={!passphrase || busy}>{busy ? "Opening…" : "Open family workspace"}</button>{error && <p className="notice notice-error" role="alert">{error}</p>}</section> : <>
      <section className="family-summary"><div><span>Family</span><strong>{workspace.family.name}</strong></div><div><span>Owner-parent</span><strong>{workspace.parent.displayName}</strong></div><div><span>Children</span><strong>{workspace.children.length}</strong></div></section>
      <section className="import-card"><h2>Add a child</h2><form className="profile-form" onSubmit={addChild}><label>Name<input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label><label>Board<input value={draft.board} onChange={(event) => setDraft({ ...draft, board: event.target.value })} /></label><label>Grade<input type="number" min="1" max="12" value={draft.grade} onChange={(event) => setDraft({ ...draft, grade: Number(event.target.value) })} /></label><label>PIN (4–8 digits)<input type="password" inputMode="numeric" value={draft.pin} onChange={(event) => setDraft({ ...draft, pin: event.target.value })} /></label><button disabled={busy}>Add child</button></form>{error && <p className="notice notice-error" role="alert">{error}</p>}{message && <p className="notice">{message}</p>}</section>
      <section className="library-section"><h2>Children</h2>{workspace.children.length === 0 ? <p className="empty-state">No child profiles yet.</p> : <div className="child-admin-grid">{workspace.children.map((item) => <ChildEditor key={item.id} child={item} passphrase={passphrase} onSaved={load} />)}</div>}</section>
    </>}
  </main>;
}

function ChildEditor({ child, passphrase, onSaved }: { child: Child; passphrase: string; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState({ ...child, pin: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus("");
    const response = await fetch("/api/parent/children", { method: "PATCH", headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": passphrase }, body: JSON.stringify(value) });
    const body = await response.json();
    if (response.ok) { setValue({ ...value, pin: "" }); setStatus("Saved."); await onSaved(); } else setStatus(body.error ?? "Could not save.");
    setBusy(false);
  }
  return <form className={`child-admin-card${value.active ? "" : " is-inactive"}`} onSubmit={save}><label>Name<input value={value.displayName} onChange={(event) => setValue({ ...value, displayName: event.target.value })} /></label><div className="profile-row"><label>Board<input value={value.board} onChange={(event) => setValue({ ...value, board: event.target.value })} /></label><label>Grade<input type="number" min="1" max="12" value={value.grade} onChange={(event) => setValue({ ...value, grade: Number(event.target.value) })} /></label></div><label>New PIN (leave blank to keep)<input type="password" inputMode="numeric" value={value.pin} onChange={(event) => setValue({ ...value, pin: event.target.value })} /></label><label className="active-toggle"><input type="checkbox" checked={value.active} onChange={(event) => setValue({ ...value, active: event.target.checked })} /> Active profile</label><div className="button-row"><button disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>{status && <span>{status}</span>}</div></form>;
}
