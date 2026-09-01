"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Child = { id: string; displayName: string; board: string; grade: number };

export function LoginExperience() {
  const requestedRole = useSearchParams().get("role");
  const [role, setRole] = useState<"choose" | "parent" | "child">(requestedRole === "parent" || requestedRole === "child" ? requestedRole : "choose");
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

  return <main className="login-shell"><Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link><section className="login-card"><p className="eyebrow">Family sign in</p>{role === "choose" && <><h1>Who is using StudyCraft?</h1><div className="role-choice"><button onClick={() => setRole("parent")}><strong>Parent</strong><span>Manage content and progress</span></button><button onClick={() => setRole("child")}><strong>Child</strong><span>Choose your profile and study</span></button></div></>}{role === "parent" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Choose another role</button><h1>Parent sign in</h1><form onSubmit={parentLogin}><label>Family password<input autoFocus type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label><button disabled={!passphrase || busy}>{busy ? "Signing in…" : "Sign in"}</button></form></>}{role === "child" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Choose another role</button><h1>Who is studying?</h1>{deviceLocked ? <div className="empty-study"><p>A parent needs to sign in once on this device.</p><button onClick={() => setRole("parent")}>Parent sign in</button></div> : <><div className="profile-choice-grid">{children.map((child) => <button key={child.id} className={selected?.id === child.id ? "is-selected" : ""} onClick={() => { setSelected(child); setPin(""); }}><span className="profile-avatar">{child.displayName.slice(0, 1).toUpperCase()}</span><strong>{child.displayName}</strong><small>{child.board} · Grade {child.grade}</small></button>)}</div>{selected && <form className="pin-form" onSubmit={childLogin}><label>{selected.displayName}’s PIN<input autoFocus type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} /></label><button disabled={!/^\d{4,8}$/.test(pin) || busy}>{busy ? "Opening…" : "Start studying"}</button></form>}</>}</>}{error && <p className="notice notice-error" role="alert">{error}</p>}</section></main>;
}
