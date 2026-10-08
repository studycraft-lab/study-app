import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoWindowsLesson } from "@/components/icso-windows-lesson";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "Windows 11 — StudyCraft ICSO",
  description: "An interactive Grade 6 ICSO lesson on Windows 11 navigation and shortcuts.",
};

export default async function Windows11Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/windows-11", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoWindowsLesson childName={child.displayName} />;
}
