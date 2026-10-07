import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoFoundationsLesson } from "@/components/icso-foundations-lesson";
import { fundamentalsLesson } from "@/components/icso-foundations-data";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "Computer Fundamentals — StudyCraft ICSO",
  description: "An interactive Grade 6 ICSO lesson on devices, software and code.",
};

export default async function FundamentalsPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/fundamentals-of-computers", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoFoundationsLesson lesson={fundamentalsLesson} childName={child.displayName} />;
}
