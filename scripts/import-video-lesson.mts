/** Run with --env-file=.env.local; never pass credentials in command arguments. */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

type Manifest = {
  schemaVersion: string; slug: string; contentVersion: number; title: string; description: string;
  source: { board: string; grade: number; subject: string; chapterTitle: string; chapterNumber: number | null; reviewed: boolean };
  durationSeconds: number; chapters: { title: string; start: number }[];
  assets: Record<string, { file: string; sha256: string; contentType: string }>;
};
const [manifestPath, mediaDirectory, courseId, mode] = process.argv.slice(2);
if (!manifestPath || !mediaDirectory || !courseId || mode && !["--publish", "--check"].includes(mode)) throw new Error("Usage: node --env-file=.env.local --import tsx scripts/import-video-lesson.mts manifest.json media-directory course-id [--publish|--check]");
const manifest: Manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.schemaVersion !== "video-1.0" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.slug) || !Number.isInteger(manifest.contentVersion) || manifest.contentVersion < 1 || !manifest.source.reviewed) throw new Error("Use a reviewed, versioned video manifest.");
if (!Number.isFinite(manifest.durationSeconds) || manifest.durationSeconds <= 0 || !manifest.chapters.length || manifest.chapters[0].start !== 0 || manifest.chapters.some((ch, i) => !ch.title || !Number.isFinite(ch.start) || ch.start < 0 || ch.start >= manifest.durationSeconds || i > 0 && ch.start <= manifest.chapters[i - 1].start)) throw new Error("Chapter timings must be ordered within the video duration.");
const expected = { "lesson.mp4": "video/mp4", "poster.jpg": "image/jpeg", "captions.en.vtt": "text/vtt" };
const digest = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
const files = await Promise.all(Object.entries(expected).map(async ([name, mime]) => {
  const asset = manifest.assets[name];
  if (!asset || basename(asset.file) !== asset.file || asset.contentType !== mime) throw new Error(`Missing or invalid ${name}`);
  const bytes = await readFile(resolve(mediaDirectory, asset.file));
  if (digest(bytes) !== asset.sha256) throw new Error(`${name} does not match the approved manifest.`);
  return { name, mime, bytes, sha256: asset.sha256 };
}));
const contentHash = digest(JSON.stringify(manifest));
if (mode === "--check") { console.log(JSON.stringify({ valid: true, contentHash, assets: files.length })); process.exit(0); }
const publish = mode === "--publish";
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) throw new Error("Configure server-only Supabase environment variables.");
const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: course, error: courseError } = await client.from("courses").select("id,family_id,board,grade,subject").eq("id", courseId).single();
if (courseError || !course || course.board !== manifest.source.board || course.grade !== manifest.source.grade || course.subject !== manifest.source.subject) throw new Error("Course does not match the video's board, grade and subject.");
const { data: matching, error: matchingError } = await client.from("chapters").select("id,title").eq("course_id", courseId).eq("title", manifest.source.chapterTitle);
if (matchingError || (matching?.length ?? 0) > 1) throw new Error("Choose an unambiguous chapter mapping.");
let chapterId = matching?.[0]?.id as string | undefined;
if (!chapterId) {
  // Match the existing question-bank import's chapter identity convention.
  const fingerprint = createHash("md5").update([courseId, manifest.source.chapterNumber ?? "", manifest.source.chapterTitle.toLowerCase()].join("|")).digest("hex");
  const { data, error } = await client.from("chapters").insert({ course_id: courseId, fingerprint, chapter_number: manifest.source.chapterNumber, title: manifest.source.chapterTitle }).select("id").single();
  if (error || !data) throw new Error("Could not create the video chapter.");
  chapterId = data.id;
}
const { data: existing, error: existingError } = await client.from("tutor_video_lessons").select("id,content_hash,status,asset_prefix").eq("chapter_id", chapterId).eq("slug", manifest.slug).eq("content_version", manifest.contentVersion).maybeSingle();
if (existingError) throw new Error("Apply the video lesson migration first.");
if (existing && existing.content_hash !== contentHash) throw new Error("Version collision: increase contentVersion instead of replacing published media.");
{
  const bucket = "tutor-videos";
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  if (bucketError) throw new Error("Could not inspect video storage.");
  const currentBucket = buckets.find(item => item.id === bucket);
  if (currentBucket?.public) throw new Error("The video bucket must be private.");
  if (!currentBucket) {
    const { error } = await client.storage.createBucket(bucket, { public: false, fileSizeLimit: 50 * 1024 * 1024, allowedMimeTypes: Object.values(expected) });
    if (error) throw new Error(`Could not create private video storage: ${error.message}`);
  }
  const prefix = existing?.asset_prefix ?? `${course.family_id}/${chapterId}/${manifest.slug}/v${manifest.contentVersion}`;
  for (const file of files) {
    const path = `${prefix}/${file.name}`;
    const { error } = await client.storage.from(bucket).upload(path, file.bytes, { contentType: file.mime, upsert: false, cacheControl: "3600" });
    if (error) {
      // A failed earlier import may have uploaded some files. Never overwrite them.
      const { data, error: downloadError } = await client.storage.from(bucket).download(path);
      if (downloadError || !data || digest(Buffer.from(await data.arrayBuffer())) !== file.sha256) throw new Error(`Could not upload verified ${file.name}: ${error.message}`);
    }
  }
  if (existing) {
    if (publish && existing.status !== "published") {
      const { error } = await client.from("tutor_video_lessons").update({ status: "published" }).eq("id", existing.id);
      if (error) throw new Error("Could not publish the verified video.");
    }
    console.log(JSON.stringify({ id: existing.id, chapterId, status: publish ? "published" : existing.status, created: false }));
  } else {
    const { data, error } = await client.from("tutor_video_lessons").insert({ chapter_id: chapterId, slug: manifest.slug, content_version: manifest.contentVersion, title: manifest.title, description: manifest.description, duration_seconds: manifest.durationSeconds, chapters: manifest.chapters, asset_prefix: prefix, content_hash: contentHash, status: publish ? "published" : "draft" }).select("id,status").single();
    if (error || !data) throw new Error("Media uploaded, but lesson registration failed. The same import can be retried safely.");
    console.log(JSON.stringify({ id: data.id, chapterId, status: data.status, created: true }));
  }
}
