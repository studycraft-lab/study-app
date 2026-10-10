import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoLatestItLesson } from "@/components/icso-latest-it-lesson";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "Latest Developments in IT — StudyCraft ICSO",
  description: "An interactive Grade 6 ICSO lesson on current operating systems, assistants and IT concepts.",
};

export default async function LatestDevelopmentsItPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/latest-developments-it", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoLatestItLesson childName={child.displayName} />;
}
