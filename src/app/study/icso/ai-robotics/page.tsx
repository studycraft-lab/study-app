import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoConceptLesson } from "@/components/icso-concept-lesson";
import { aiRoboticsLesson } from "@/components/icso-concept-lessons";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "AI & Robotics — StudyCraft ICSO",
  description: "A short interactive Grade 6 ICSO lesson on AI domains and robots.",
};

export default async function AiRoboticsPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/ai-robotics", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoConceptLesson lesson={aiRoboticsLesson} childName={child.displayName} />;
}
