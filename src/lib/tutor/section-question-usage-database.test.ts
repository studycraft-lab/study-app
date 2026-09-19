// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import pack from "../../../examples/lesson-packs/synthetic-shapes.json";
import { initialTutorState } from "./state";

const db = new PGlite();
let child: string; let sibling: string; let progress: string;
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql", "20260901030000_create_family_profiles.sql", "20260915010000_create_tutor_content.sql", "20260915020000_create_tutor_progress.sql", "20260919070000_limit_tutor_text_questions.sql"]) await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
  const family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  const children = await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values($1,'A','Demo',6,'s','h'),($1,'B','Demo',6,'s','h') returning id", [family]);
  [child, sibling] = children.rows.map(row => row.id);
  await db.query("insert into courses(family_id,fingerprint,board,grade,subject) values($1,'c','Demo',6,'Geometry')", [family]);
  const chapter = (await db.query<{ id: string }>("insert into chapters(course_id,fingerprint,title) select id,'ch','Synthetic shapes' from courses returning id")).rows[0].id;
  const packId = (await db.query<{ result: { id: string } }>("select import_tutor_pack($1,$2,$3,$4) as result", [family, chapter, pack, "a".repeat(64)])).rows[0].result.id;
  await db.query("select manage_tutor_pack($1,$2,'preview')", [family, packId]); await db.query("select manage_tutor_pack($1,$2,'publish')", [family, packId]);
  progress = (await db.query<{ result: { id: string } }>("select start_tutor_progress($1,$2,$3) as result", [child, packId, initialTutorState()])).rows[0].result.id;
}, 60000);
afterAll(async () => { await db.close(); });
const reserve = (childId = child, progressId = progress) => db.query("select reserve_tutor_text_question($1,$2)", [childId, progressId]);

it("checks ownership and permits only service-role execution", async () => {
  await expect(reserve(sibling)).rejects.toThrow("Lesson unavailable");
  await expect(reserve(child, crypto.randomUUID())).rejects.toThrow("Lesson unavailable");
  expect((await db.query<{ allowed: boolean }>("select has_function_privilege('anon','public.reserve_tutor_text_question(uuid,uuid)','EXECUTE') as allowed")).rows[0].allowed).toBe(false);
  expect((await db.query<{ allowed: boolean }>("select has_function_privilege('service_role','public.reserve_tutor_text_question(uuid,uuid)','EXECUTE') as allowed")).rows[0].allowed).toBe(true);
});

it("limits bursts and daily questions without storing their text", async () => {
  for (let i = 0; i < 5; i += 1) await reserve();
  await expect(reserve()).rejects.toThrow("Too many questions");
  for (let i = 5; i < 40; i += 1) {
    if (i % 5 === 0) await db.exec("update tutor_text_question_usage set created_at=now()-interval '2 minutes'");
    await reserve();
  }
  await db.exec("update tutor_text_question_usage set created_at=now()-interval '2 minutes'");
  await expect(reserve()).rejects.toThrow("Daily question allowance");
  expect((await db.query<{ count: number }>("select count(*)::int as count from tutor_text_question_usage")).rows[0].count).toBe(40);
});
