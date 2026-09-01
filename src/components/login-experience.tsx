"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "choose" | "parent" | "child" | "admin";

export function LoginExperience() {
  const requestedRole = useSearchParams().get("role");
  const initialRole: Role = requestedRole === "parent" || requestedRole === "child" || requestedRole === "admin" ? requestedRole : "choose";
  const [role, setRole] = useState<Role>(initialRole);
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [childName, setChildName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function goBack() { setRole("choose"); setError(""); }

  async function parentLogin(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/parent/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passphrase }) });
    const body = await response.json();
    if (response.ok) router.push("/parent/family"); else setError(body.error ?? "Could not sign in.");
    setBusy(false);
  }

  async function childLogin(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/child/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName: childName, pin }) });
    const body = await response.json();
    if (response.ok) router.push("/study/dashboard"); else setError(body.error ?? "Could not sign in.");
    setBusy(false);
  }

  return <main className="login-shell">
    <Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link>
    <section className="login-card">
      {role === "choose" && <><p className="eyebrow">Sign in</p><h1>Who is signing in?</h1><div className="role-choice"><button onClick={() => setRole("child")}><strong>Child</strong><span>Study a chapter</span></button><button onClick={() => setRole("parent")}><strong>Parent</strong><span>Manage children and content</span></button></div><button className="admin-login-link" onClick={() => setRole("admin")}>Platform admin</button></>}

      {role === "child" && <><button className="back-link" onClick={goBack}>← Back</button><p className="eyebrow">Child account</p><h1>Welcome back</h1><form className="login-form" onSubmit={childLogin}><label className="login-field">Name<input className="login-input" autoFocus autoComplete="username" value={childName} onChange={(event) => setChildName(event.target.value)} /></label><label className="login-field">PIN<input className="login-input" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(event) => setPin(event.target.value)} /></label><button className="login-submit" disabled={!childName.trim() || !/^\d{4,8}$/.test(pin) || busy}>{busy ? "Signing in…" : "Sign in"}</button></form></>}

      {role === "parent" && <><button className="back-link" onClick={goBack}>← Back</button><p className="eyebrow">Parent account</p><h1>Welcome back</h1><form className="login-form" onSubmit={parentLogin}><label className="login-field">Family password<input className="login-input" autoFocus type="password" autoComplete="current-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></label><button className="login-submit" disabled={!passphrase || busy}>{busy ? "Signing in…" : "Sign in"}</button></form></>}

      {role === "admin" && <><button className="back-link" onClick={goBack}>← Back</button><p className="eyebrow">Administration</p><h1>Platform admin</h1><p className="empty-state">Platform administration is not enabled yet.</p></>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}
    </section>
  </main>;
}
