import { ParentLibrary } from "@/components/parent-library";

export default function ParentLibraryPage() {
  return <ParentLibrary tutorEnabled={process.env.TUTOR_ENABLED === "true"} />;
}
