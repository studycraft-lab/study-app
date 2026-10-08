import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoFoundationsLesson } from "@/components/icso-foundations-lesson";
import { historyLesson } from "@/components/icso-history-data";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "History & Generations of Computers — StudyCraft ICSO",
  description: "An interactive Grade 6 ICSO lesson on computer history and generations.",
};

export default async function HistoryGenerationsPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/history-generations", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoFoundationsLesson lesson={historyLesson} childName={child.displayName} />;
}
