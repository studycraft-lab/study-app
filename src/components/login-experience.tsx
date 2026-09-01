"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginExperience() {
  const requestedRole = useSearchParams().get("role");
  const [role, setRole] = useState<"choose" | "parent" | "child" | "admin">(requestedRole === "parent" || requestedRole === "child" || requestedRole === "admin" ? requestedRole : "choose");
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [childName, setChildName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function parentLogin(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/parent/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passphrase }) });
    const body = await response.json();
    if (response.ok) router.push("/parent/library"); else setError(body.error ?? "Could not sign in.");
    setBusy(false);
  }
  async function childLogin(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/child/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName: childName, pin }) });
    const body = await response.json();
    if (response.ok) router.push("/study"); else setError(body.error ?? "Could not sign in.");
    setBusy(false);
  }

  return <main className="login-shell"><Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link><section className="login-card"><p className="eyebrow">Sign in</p>{role === "choose" && <><h1>Who is signing in?</h1><div className="role-choice"><button onClick={() => setRole("child")}><strong>Child</strong><span>Study a chapter</span></button><button onClick={() => setRole("parent")}><strong>Parent</strong><span>Manage children and content</span></button></div><button className="admin-login-link" onClick={() => setRole("admin")}>Platform admin</button></>}{role === "parent" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Back</button><h1>Parent sign in</h1><form onSubmit={parentLogin}><label>Family password<input autoFocus type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label><button disabled={!passphrase || busy}>{busy ? "Signing in…" : "Sign in"}</button></form></>}{role === "admin" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Back</button><h1>Platform admin</h1><p className="empty-state">Platform administration is not enabled yet.</p></>}{role === "child" && <><button className="back-link" onClick={() => { setRole("choose"); setError(""); }}>← Back</button><h1>Child sign in</h1><form onSubmit={childLogin}><label>Name<input autoFocus autoComplete="username" value={childName} onChange={(event) => setChildName(event.target.value)} /></label><label>PIN<input type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} /></label><button disabled={!childName.trim() || !/^\d{4,8}$/.test(pin) || busy}>{busy ? "Signing in…" : "Sign in"}</button></form></>}{error && <p className="notice notice-error" role="alert">{error}</p>}</section></main>;
}
