// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("keeps video metadata private and enforces chapter ownership and version identity", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
    await db.exec(readFileSync("supabase/migrations/20260901010000_create_content_library.sql", "utf8").replace("create extension if not exists pgcrypto;", ""));
    await db.exec(readFileSync("supabase/migrations/20260927070106_create_tutor_video_lessons.sql", "utf8"));
    const chapter = "11111111-1111-1111-1111-111111111111";
    await db.exec(`insert into courses(fingerprint,board,grade,subject) values ('course','ICSE',6,'English Literature'); insert into chapters(id,course_id,fingerprint,title) select '${chapter}',id,'poem','Poem' from courses;`);
    const insert = "insert into tutor_video_lessons(chapter_id,slug,content_version,title,description,duration_seconds,asset_prefix,chapters,content_hash) values ($1,'poem',1,'Poem','Read together',60,$2,'[]',$3)";
    await db.query(insert, [chapter, "private/video/v1", "a".repeat(64)]);
    await expect(db.query(insert, [chapter, "private/video/duplicate", "a".repeat(64)])).rejects.toThrow("unique");
    await expect(db.query(insert, ["22222222-2222-2222-2222-222222222222", "private/missing", "a".repeat(64)])).rejects.toThrow("foreign key");
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(db.query("select * from tutor_video_lessons")).rejects.toThrow("permission denied");
      await db.exec("reset role");
    }
    expect((await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname='tutor_video_lessons'")).rows[0].relrowsecurity).toBe(true);
  } finally { await db.close(); }
}, 60000);
