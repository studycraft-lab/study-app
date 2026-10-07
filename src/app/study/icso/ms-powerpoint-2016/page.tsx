import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PowerPoint2016Lesson } from "@/components/powerpoint-2016-lesson";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "MS PowerPoint 2016 — StudyCraft",
  description: "A short interactive Grade 6 ICSO lesson on MS PowerPoint 2016.",
};

export default async function PowerPoint2016Page() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/ms-powerpoint-2016", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <PowerPoint2016Lesson childName={child.displayName} />;
}
