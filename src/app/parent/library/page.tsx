import Link from "next/link";
import { ParentLibrary } from "@/components/parent-library";

export default function ParentLibraryPage() {
  return <>{process.env.TUTOR_ENABLED === "true" && <p><Link href="/parent/library/tutor">Tutoring lessons</Link></p>}<ParentLibrary /></>;
}
