"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AppHeader({ role, childName }: { role: "parent" | "child"; childName?: string }) {
  const router = useRouter();
  async function leave(lockFamily: boolean) {
    await fetch(lockFamily ? "/api/family/logout" : role === "parent" ? "/api/parent/logout" : "/api/child/logout", { method: "POST" });
    router.push(lockFamily ? "/login" : `/login?role=${role === "parent" ? "parent" : "child"}`);
  }
  return <header className="app-header"><Link className="brand" href="/"><span className="brand-mark">S</span><span>StudyCraft</span></Link><nav>{role === "parent" ? <><Link href="/parent/library">Content</Link><Link href="/parent/family">Children & progress</Link></> : <Link href="/study">Study</Link>}<span className="role-label">{role === "parent" ? "Parent" : childName}</span><button className="button-quiet" onClick={() => leave(false)}>Switch user</button><button className="button-quiet" onClick={() => leave(true)}>Logout</button></nav></header>;
}
