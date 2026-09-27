export type VideoChapter = { title: string; start: number };
export type VideoLesson = {
  id: string;
  chapter_id: string;
  chapter_title: string;
  board: string;
  grade: number;
  subject: string;
  title: string;
  description: string;
  duration_seconds: number;
  content_version: number;
  status: "draft" | "published" | "archived";
  chapters: VideoChapter[];
};
export type VideoPlayback = { lesson: VideoLesson; videoUrl: string; posterUrl: string; captionsUrl: string };
export function videoTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
