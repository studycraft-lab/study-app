import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoFoundationsLesson } from "@/components/icso-foundations-lesson";
import { memoryLesson } from "@/components/icso-foundations-data";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "Memory & Storage — StudyCraft ICSO",
  description: "An interactive Grade 6 ICSO lesson on memory and storage devices.",
};

export default async function MemoryStoragePage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/memory-storage", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoFoundationsLesson lesson={memoryLesson} childName={child.displayName} />;
}
