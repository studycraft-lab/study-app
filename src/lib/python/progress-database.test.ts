// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
let first: string;
let second: string;

beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql", "20260901030000_create_family_profiles.sql", "20260922050000_create_python_practice_progress.sql"]) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
  }
  const family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  const result = await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values ($1,'A','Demo',6,'s','h'),($1,'B','Demo',6,'s','h') returning id", [family]);
  [first, second] = result.rows.map((row) => row.id);
}, 60000);

afterAll(async () => { await db.close(); });

it("keeps each child's answer separate and permits a restart", async () => {
  await db.query("insert into python_practice_answers(child_id,question_id,answer,passed) values ($1,'q-041','print(22)',true),($2,'q-041','print(13)',false)", [first, second]);
  expect((await db.query<{ answer: string; passed: boolean }>("select answer,passed from python_practice_answers where child_id=$1 and question_id='q-041'", [first])).rows).toEqual([{ answer: "print(22)", passed: true }]);
  await db.query("update python_practice_answers set answer='',checked=false,passed=false where child_id=$1 and question_id='q-041'", [first]);
  expect((await db.query<{ answer: string; passed: boolean }>("select answer,passed from python_practice_answers where child_id=$1 and question_id='q-041'", [first])).rows).toEqual([{ answer: "", passed: false }]);
  expect((await db.query<{ answer: string }>("select answer from python_practice_answers where child_id=$1 and question_id='q-041'", [second])).rows[0].answer).toBe("print(13)");
});
