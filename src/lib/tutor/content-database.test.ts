// @vitest-environment node
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import pack from "../../../examples/lesson-packs/synthetic-shapes.json";

const db = new PGlite();
let family: string; let chapter: string;
const hash = "a".repeat(64);
const importPack = (value = pack, digest = hash, owner = family) => db.query<{ result: { id: string; created: boolean } }>("select import_tutor_pack($1,$2,$3,$4) as result", [owner, chapter, value, digest]);
const manage = (id: string, action: string, owner = family) => db.query("select manage_tutor_pack($1,$2,$3)", [owner, id, action]);
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql", "20260901030000_create_family_profiles.sql", "20260915010000_create_tutor_content.sql"]) {
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
  }
  family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  await db.query("insert into courses (fingerprint,board,grade,subject,family_id) values ('test','Demo',6,'Geometry',$1)", [family]);
  chapter = (await db.query<{ id: string }>("insert into chapters(course_id,fingerprint,title) select id,'chapter','Synthetic shapes' from courses returning id")).rows[0].id;
}, 60000);
beforeEach(async () => { await db.exec("delete from tutor_packs; delete from tutor_sections;"); });
afterAll(async () => { await db.close(); });

describe("tutor content SQL executed in local PGlite (not deployed Supabase)", () => {
  it("imports idempotently and detects immutable content collisions", async () => {
    const first = (await importPack()).rows[0].result;
    expect(first.created).toBe(true);
    expect((await importPack()).rows[0].result).toEqual({ id: first.id, created: false });
    await expect(importPack(pack, "b".repeat(64))).rejects.toThrow("Version collision");
    expect((await db.query("select * from tutor_packs")).rows).toHaveLength(1);
  });
  it("rolls back a newly inserted section if pack insertion fails", async () => {
    await expect(importPack(pack, "bad-hash")).rejects.toThrow();
    expect((await db.query("select * from tutor_sections")).rows).toHaveLength(0);
    expect((await db.query("select * from tutor_packs")).rows).toHaveLength(0);
  });
  it("requires preview and preserves older immutable versions on replacement", async () => {
    const first = (await importPack()).rows[0].result.id;
    await expect(manage(first, "publish")).rejects.toThrow("Preview");
    await manage(first, "preview"); await manage(first, "publish");
    const second = (await importPack({ ...pack, contentVersion: 2 }, "b".repeat(64))).rows[0].result.id;
    await manage(second, "preview"); await manage(second, "publish");
    const rows = (await db.query<{ id: string; status: string; payload: unknown }>("select id,status,payload from tutor_packs order by content_version")).rows;
    expect(rows.map(r => r.status)).toEqual(["archived", "published"]);
    expect(rows[0].payload).toEqual(pack);
    await manage(second, "archive");
    expect((await db.query("select * from tutor_packs")).rows).toHaveLength(2);
    await expect(manage(first, "publish")).rejects.toThrow("Archived");
  });
  it("rejects foreign-family and mismatched chapter access", async () => {
    const other = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    await expect(importPack(pack, hash, other)).rejects.toThrow("Chapter unavailable");
    await expect(importPack({ ...pack, source: { ...pack.source, grade: 7 } })).rejects.toThrow("does not match");
    const id = (await importPack()).rows[0].result.id;
    await expect(manage(id, "preview", other)).rejects.toThrow("Lesson unavailable");
    await expect(manage(id, "publish", other)).rejects.toThrow("Lesson unavailable");
    await expect(manage(id, "archive", other)).rejects.toThrow("Lesson unavailable");
  });
  it("prevents publication of source-unverified content", async () => {
    const id = (await importPack({ ...pack, source: { ...pack.source, sourceStatus: "unverified" } })).rows[0].result.id;
    await manage(id, "preview"); await expect(manage(id, "publish")).rejects.toThrow("Review this lesson");
  });
  it("denies direct anonymous table access and RPC execution", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select * from tutor_packs")).rejects.toThrow("permission denied");
      await expect(importPack()).rejects.toThrow("permission denied");
    } finally { await db.exec("reset role"); }
  });
});
