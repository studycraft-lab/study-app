import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HtmlCssScratchLesson } from "@/components/html-css-scratch-lesson";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "HTML, CSS & Scratch — StudyCraft ICSO",
  description: "A short interactive Grade 6 ICSO lesson on HTML, CSS and Scratch.",
};

export default async function HtmlCssScratchPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/icso/html-css-scratch", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <HtmlCssScratchLesson childName={child.displayName} />;
}
