// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
let first: string;
let second: string;

beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql", "20260901030000_create_family_profiles.sql", "20261002010000_create_grammar_batch_progress.sql"]) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
  }
  const family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  const children = await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values ($1,'A','Demo',6,'s','h'),($1,'B','Demo',6,'s','h') returning id", [family]);
  [first, second] = children.rows.map((row) => row.id);
}, 60000);

afterAll(async () => { await db.close(); });

it("keeps each child's checked batch separate and permits a retry", async () => {
  await db.query("insert into grammar_batch_progress(child_id,lesson_slug,content_version,batch_index,answers) values ($1,'question-tags',1,0,$2),($3,'question-tags',1,0,$4)", [first, JSON.stringify(["aren't they", "have you", "can't he", "shall we", "did they"]), second, JSON.stringify(["", "", "", "", ""])]);
  expect((await db.query<{ answers: string[] }>("select answers from grammar_batch_progress where child_id=$1", [first])).rows[0].answers[0]).toBe("aren't they");
  await db.query("update grammar_batch_progress set answers=$2 where child_id=$1 and batch_index=0", [first, JSON.stringify(["wrong", "", "", "", ""])]);
  expect((await db.query<{ answers: string[] }>("select answers from grammar_batch_progress where child_id=$1", [second])).rows[0].answers[0]).toBe("");
});
