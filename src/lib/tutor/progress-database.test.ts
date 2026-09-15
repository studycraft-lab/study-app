// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import pack from "../../../examples/lesson-packs/synthetic-shapes.json";
import { initialTutorState } from "./state";
const db = new PGlite(); let child: string; let sibling: string; let packId: string; let family: string;
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql", "20260901030000_create_family_profiles.sql", "20260915010000_create_tutor_content.sql", "20260915020000_create_tutor_progress.sql"]) await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
  family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  const children = await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values ($1,'A','Demo',6,'s','h'),($1,'B','Demo',6,'s','h') returning id", [family]);
  [child, sibling] = children.rows.map(r => r.id);
  await db.query("insert into courses(family_id,fingerprint,board,grade,subject) values($1,'c','Demo',6,'Geometry')", [family]);
  const chapter = (await db.query<{ id: string }>("insert into chapters(course_id,fingerprint,title) select id,'ch','Synthetic shapes' from courses returning id")).rows[0].id;
  packId = (await db.query<{ result: { id: string } }>("select import_tutor_pack($1,$2,$3,$4) as result", [family, chapter, pack, "a".repeat(64)])).rows[0].result.id;
}, 60000);
afterAll(async () => { await db.close(); });
it("enforces publication, independent sibling progress, CAS and pinned archive recovery", async () => {
  const start = (id: string) => db.query<{ result: { id: string; state: unknown } }>("select start_tutor_progress($1,$2,$3) as result", [id, packId, initialTutorState()]);
  await expect(start(child)).rejects.toThrow("no longer available");
  await db.query("select manage_tutor_pack($1,$2,'preview')", [family, packId]); await db.query("select manage_tutor_pack($1,$2,'publish')", [family, packId]);
  const first = (await start(child)).rows[0].result;
  const other = (await start(sibling)).rows[0].result;
  expect(first.id).not.toBe(other.id);
  const next = { ...initialTutorState(), phase: "understanding", revision: 1 };
  await expect(db.query("select save_tutor_progress($1,$2,0,$3)", [sibling, first.id, next])).rejects.toThrow("Progress changed");
  await db.query("select save_tutor_progress($1,$2,0,$3)", [child, first.id, next]);
  await expect(db.query("select save_tutor_progress($1,$2,0,$3)", [child, first.id, next])).rejects.toThrow("Progress changed");
  expect((await start(sibling)).rows[0].result.state).toEqual(initialTutorState());
  await db.query("select manage_tutor_pack($1,$2,'archive')", [family, packId]);
  expect((await start(child)).rows[0].result.id).toBe(first.id);
  const newChild = (await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values ($1,'C','Demo',6,'s','h') returning id", [family])).rows[0].id;
  await expect(start(newChild)).rejects.toThrow("no longer available");
  await db.query("update child_profiles set grade=7 where id=$1", [child]);
  await expect(start(child)).rejects.toThrow("unavailable for this child");
  expect((await db.query("select * from question_banks")).rows).toHaveLength(0);
});
