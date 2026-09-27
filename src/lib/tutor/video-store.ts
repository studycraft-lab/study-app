import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { tutorChapters } from "./content-store";
import type { TutorChapter } from "./request-store";
import type { TutorChild } from "./progress-store";
import { TutorError } from "./http";
import type { VideoLesson, VideoPlayback } from "./video-types";

export const VIDEO_BUCKET = "tutor-videos";
type VideoRow = Omit<VideoLesson, "chapter_title" | "board" | "grade" | "subject"> & { asset_prefix: string };

async function eligibleRows(familyId: string, child?: TutorChild, id?: string) {
  const all = await tutorChapters(familyId) as unknown as TutorChapter[];
  const chapters = all.filter(ch => !child || ch.courses.board.toLowerCase() === child.board.toLowerCase() && ch.courses.grade === child.grade);
  if (!chapters.length) return [];
  let query = adminClient().from("tutor_video_lessons")
    .select("id,chapter_id,title,description,duration_seconds,content_version,status,chapters,asset_prefix")
    .in("chapter_id", chapters.map(ch => ch.id)).order("created_at", { ascending: false });
  if (child) query = query.eq("status", "published");
  if (id) query = query.eq("id", id);
  const { data, error } = await query;
  if (error) throw new Error("Video lessons unavailable.");
  return ((data ?? []) as VideoRow[]).map(row => {
    const chapter = chapters.find(ch => ch.id === row.chapter_id)!;
    const { asset_prefix, ...metadata } = row;
    const lesson: VideoLesson = { ...metadata, duration_seconds: Number(row.duration_seconds), chapter_title: chapter.title, board: chapter.courses.board, grade: chapter.courses.grade, subject: chapter.courses.subject };
    return { lesson, asset_prefix };
  });
}

export async function videoLessons(familyId: string, child?: TutorChild): Promise<VideoLesson[]> {
  return (await eligibleRows(familyId, child)).map(row => row.lesson);
}

export async function videoPlayback(familyId: string, id: string, child?: TutorChild): Promise<VideoPlayback> {
  const row = (await eligibleRows(familyId, child, id))[0];
  if (!row) throw new TutorError("This video lesson is unavailable.", 404);
  const paths = ["lesson.mp4", "poster.jpg", "captions.en.vtt"].map(name => `${row.asset_prefix}/${name}`);
  const { data, error } = await adminClient().storage.from(VIDEO_BUCKET).createSignedUrls(paths, 2 * 60 * 60);
  if (error || !data || data.length !== 3 || data.some(item => item.error || !item.signedUrl)) throw new TutorError("The video could not be opened. Please try again.", 503);
  return { lesson: row.lesson, videoUrl: data[0].signedUrl!, posterUrl: data[1].signedUrl!, captionsUrl: data[2].signedUrl! };
}

export async function setVideoStatus(familyId: string, id: string, status: "published" | "archived") {
  if (!(await eligibleRows(familyId, undefined, id)).length) throw new TutorError("This video lesson is unavailable.", 404);
  const { error } = await adminClient().from("tutor_video_lessons").update({ status }).eq("id", id);
  if (error) throw new Error("Could not update the video lesson.");
}
