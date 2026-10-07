import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IcsoConceptLesson } from "@/components/icso-concept-lesson";
import { networkingLesson } from "@/components/icso-concept-lessons";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "Networking & Cyber Safety — StudyCraft ICSO",
  description: "A short interactive Grade 6 ICSO lesson on networks and safer online choices.",
};

export default async function NetworkingCyberSafetyPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/networking-cyber-safety", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <IcsoConceptLesson lesson={networkingLesson} childName={child.displayName} />;
}
