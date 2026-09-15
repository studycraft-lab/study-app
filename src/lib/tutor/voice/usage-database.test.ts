// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import pack from "../../../../examples/lesson-packs/synthetic-shapes.json";
import { initialTutorState } from "../state";
const db = new PGlite(); let child: string; let family: string; let progress: string;
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql","20260901030000_create_family_profiles.sql","20260915010000_create_tutor_content.sql","20260915020000_create_tutor_progress.sql","20260915040000_create_tutor_voice_usage.sql"]) await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8").replace("create extension if not exists pgcrypto;",""));
  family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  child = (await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values($1,'A','Demo',6,'s','h') returning id",[family])).rows[0].id;
  await db.query("insert into courses(family_id,fingerprint,board,grade,subject) values($1,'c','Demo',6,'Geometry')",[family]);
  const chapter = (await db.query<{ id: string }>("insert into chapters(course_id,fingerprint,title) select id,'ch','Synthetic shapes' from courses returning id")).rows[0].id;
  const packId = (await db.query<{ result: { id: string } }>("select import_tutor_pack($1,$2,$3,$4) as result",[family,chapter,pack,"a".repeat(64)])).rows[0].result.id;
  await db.query("select manage_tutor_pack($1,$2,'preview')",[family,packId]); await db.query("select manage_tutor_pack($1,$2,'publish')",[family,packId]);
  progress = (await db.query<{ result: { id: string } }>("select start_tutor_progress($1,$2,$3) as result",[child,packId,initialTutorState()])).rows[0].result.id;
  await db.query("insert into tutor_voice_settings(family_id,enabled) values($1,true)",[family]);
},60000);
beforeEach(async () => { await db.exec("delete from tutor_voice_sessions; update tutor_voice_settings set enabled=true;"); });
afterAll(async () => { await db.close(); });
const reserve = (token = crypto.randomUUID(),starts = 3) => db.query<{ result: { id: string; deadline: string } }>("select reserve_tutor_voice($1,$2,'test-model',600,1200,$3,$4) as result",[child,progress,starts,token]);
it("allows only one active reservation and makes an identical start token idempotent", async () => {
  const token = crypto.randomUUID(); const first = (await reserve(token)).rows[0].result;
  expect((await reserve(token)).rows[0].result.id).toBe(first.id);
  await expect(reserve()).rejects.toThrow("Another voice session");
  await db.exec("update tutor_voice_sessions set status='termination_pending',deadline=now()-interval '1 minute'");
  await expect(reserve()).rejects.toThrow("awaiting termination");
});
it("conservatively reserves full daily allowance including early ended calls", async () => {
  await reserve(); await db.exec("update tutor_voice_sessions set status='ended'");
  await reserve(); await db.exec("update tutor_voice_sessions set status='ended'");
  await expect(reserve()).rejects.toThrow("Daily voice allowance");
});
it("enforces parent permission, authenticated progress ownership and start throttling", async () => {
  await db.exec("update tutor_voice_settings set enabled=false"); await expect(reserve()).rejects.toThrow("Parent has not enabled");
  await db.exec("update tutor_voice_settings set enabled=true");
  await expect(db.query("select reserve_tutor_voice($1,gen_random_uuid(),'model',600,1200,3,gen_random_uuid())",[child])).rejects.toThrow("Lesson unavailable");
  await reserve(crypto.randomUUID(),1); await db.exec("update tutor_voice_sessions set status='ended'");
  await expect(reserve(crypto.randomUUID(),1)).rejects.toThrow("Too many voice starts");
});
it("rejects competing start intents without two occupied slots (PGlite serialises connections)", async () => {
  const results = await Promise.allSettled([reserve(),reserve()]); expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect((await db.query("select * from tutor_voice_sessions")).rows).toHaveLength(1);
});
it("acknowledges only an owned active voice session and a persisted board revision", async () => {
  const token = crypto.randomUUID(); await reserve(token);
  await expect(db.query("select ack_tutor_voice($1,$2,0)",[child,token])).rejects.toThrow("unavailable");
  await db.exec("update tutor_voice_sessions set status='active'");
  await expect(db.query("select ack_tutor_voice($1,$2,1)",[child,token])).rejects.toThrow("unavailable");
  await db.query("select ack_tutor_voice($1,$2,0)",[child,token]);
  expect((await db.query<{ ui_revision: number }>("select ui_revision from tutor_voice_sessions")).rows[0].ui_revision).toBe(0);
  await expect(db.query("select ack_tutor_voice(gen_random_uuid(),$1,0)",[token])).rejects.toThrow("unavailable");
});
