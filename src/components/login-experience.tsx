"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Child = { id: string; displayName: string; board: string; grade: number };

export function LoginExperience() {
  const requestedRole = useSearchParams().get("role");
  const [role, setRole] = useState<"choose" | "parent" | "child" | "admin">(requestedRole === "parent" || requestedRole === "child" || requestedRole === "admin" ? requestedRole : "choose");
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<Child | null>(null);
  const [pin, setPin] = useState("");
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (role !== "child") return; void fetch("/api/child/profiles", { cache: "no-store" }).then(async (response) => { if (response.status === 401) { setDeviceLocked(true); return; } const body = await response.json(); if (response.ok) setChildren(body.children ?? []); else setError(body.error ?? "Profiles unavailable."); }); }, [role]);

  async function parentLogin(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/parent/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passphrase }) });
    const body = await response.json();
    if (response.ok) router.push("/parent/library"); else setError(body.error ?? "Could not sign in.");
    setBusy(false);
  }
  async function childLogin(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError("");
    const response = await fetch("/api/child/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ childId: selected.id, pin }) });
    const body = await response.json();
    if (response.ok) router.push("/study"); else setError(body.error ?? "Could not sign in.");
    setBusy(false);
  }

  return <main className="login-shell"><Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link><section className="login-card"><p className="eyebrow">Sign in</p>{role === "choose" && <><h1>Choose how to sign in</h1><div className="role-choice"><button onClick={() => setRole("parent")}><strong>Parent</strong><span>Manage family, content, and progress</span></button><button onClick={() => setRole("child")}><strong>Child</strong><span>Choose a profile and study</span></button><button onClick={() => setRole("admin")}><strong>Platform admin</strong><span>Manage families (when enabled)</span></button></div></>}{role === "parent" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Back to sign in</button><h1>Parent sign in</h1><form onSubmit={parentLogin}><label>Family password<input autoFocus type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label><button disabled={!passphrase || busy}>{busy ? "Signing in…" : "Sign in"}</button></form></>}{role === "admin" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Back to sign in</button><h1>Platform admin</h1><p className="empty-state">Platform administration is not enabled for this family yet.</p></>}{role === "child" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Back to sign in</button><h1>Choose a child</h1>{deviceLocked ? <div className="empty-study"><p>A parent must set up this family before a child can sign in.</p></div> : <><div className="profile-choice-grid">{children.map((child) => <button key={child.id} className={selected?.id === child.id ? "is-selected" : ""} onClick={() => { setSelected(child); setPin(""); }}><span className="profile-avatar">{child.displayName.slice(0, 1).toUpperCase()}</span><strong>{child.displayName}</strong><small>{child.board} · Grade {child.grade}</small></button>)}</div>{selected && <form className="pin-form" onSubmit={childLogin}><label>{selected.displayName}’s PIN<input autoFocus type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} /></label><button disabled={!/^\d{4,8}$/.test(pin) || busy}>{busy ? "Opening…" : "Start studying"}</button></form>}</>}</>}{error && <p className="notice notice-error" role="alert">{error}</p>}</section></main>;
}
