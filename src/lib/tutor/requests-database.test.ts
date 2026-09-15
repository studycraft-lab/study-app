// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import fixture from "../../../examples/lesson-packs/synthetic-shapes.json";
const db = new PGlite(); let family: string; let chapter: string; let a: string; let b: string;
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql", "20260901030000_create_family_profiles.sql", "20260915010000_create_tutor_content.sql", "20260915030000_create_tutor_requests.sql"]) await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
  family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  [a,b] = (await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values($1,'A','Demo',6,'s','h'),($1,'B','Demo',6,'s','h') returning id", [family])).rows.map(r => r.id);
  await db.query("insert into courses(family_id,fingerprint,board,grade,subject) values($1,'c','Demo',6,'Geometry')", [family]);
  chapter = (await db.query<{ id: string }>("insert into chapters(course_id,fingerprint,title) select id,'ch','Synthetic shapes' from courses returning id")).rows[0].id;
}, 60000);
afterAll(async () => { await db.close(); });
it("handles private sibling requests, deduplication, narrowing, publication, archive and decline", async () => {
  const request = async (child: string, heading: string, section: string | null = null) => (await db.query<{ id: string }>("select request_tutor_section($1,$2,$3,$4,'1','help') as id", [child,chapter,section,heading])).rows[0].id;
  const manage = (id: string, action: string, section: string | null = null, pack: string | null = null, reason = "", owner = family) => db.query("select manage_tutor_request($1,$2,$3,$4,$5,$6)", [owner,id,action,section,pack,reason]);
  const first = await request(a, "Shapes please"); expect(await request(a, "Shapes please")).toBe(first);
  const sibling = await request(b, "Shapes please"); expect(sibling).not.toBe(first);
  await expect(manage(first,"preparing")).rejects.toThrow("Map this request");
  const section = (await db.query<{ id: string }>("select catalogue_tutor_section($1,$2,'squares','Squares','[\"1\"]') as id", [family,chapter])).rows[0].id;
  await manage(first,"preparing",section); await manage(sibling,"preparing",section);
  const pack = { ...fixture, section: { ...fixture.section, path: [fixture.source.chapterTitle, "Squares"] } };
  const packId = (await db.query<{ result: { id: string } }>("select import_tutor_pack($1,$2,$3,$4) as result", [family,chapter,pack,"a".repeat(64)])).rows[0].result.id;
  await expect(manage(first,"ready",null,packId)).rejects.toThrow("Choose a published lesson");
  await db.query("select manage_tutor_pack($1,$2,'preview')", [family,packId]); await db.query("select manage_tutor_pack($1,$2,'publish')", [family,packId]);
  await expect(manage(first,"ready",null,packId,"","aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).rejects.toThrow("Request unavailable");
  await manage(first,"ready",null,packId); await manage(sibling,"ready",null,packId);
  expect((await db.query("select * from tutor_requests where status='ready'")).rows).toHaveLength(2);
  await db.query("select manage_tutor_pack($1,$2,'archive')", [family,packId]);
  await expect(manage(first,"ready",null,packId)).rejects.toThrow("Choose a published lesson");
  await manage(first,"decline",null,null,"We will prepare a shorter section together.");
  expect(await request(a,"Shapes please",section)).not.toBe(first);
  await db.query("update child_profiles set grade=7 where id=$1",[b]);
  await expect(request(b,"Another topic")).rejects.toThrow("Chapter unavailable");
});
