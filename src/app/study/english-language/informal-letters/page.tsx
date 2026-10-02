import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InformalLetterExperience } from "@/components/informal-letter-experience";
import { childFromRequest } from "@/lib/family/request";

export const metadata: Metadata = {
  title: "Informal Letters — StudyCraft",
  description: "Learn the school format and practise informal letters through guided cases.",
};

export default async function InformalLettersPage() {
  const cookie = (await headers()).get("cookie") ?? "";
  const child = await childFromRequest(new Request("http://studycraft.local/study/english-language/informal-letters", { headers: { cookie } }));
  if (!child || child.grade !== 6) redirect("/login?role=child");
  return <InformalLetterExperience childId={child.id} />;
}
