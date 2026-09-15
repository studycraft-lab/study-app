// @vitest-environment node
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";
import sourcePack from "../../../lesson-packs/icse-6-biology/plastids/v1.json";
import synthetic from "../../../examples/lesson-packs/synthetic-shapes.json";
import { canonicalPackJSON, validateLessonPack } from "./validate";
import { applyTutorCommand, initialTutorState, type TutorCommand, type TutorState } from "./state";
const validation = validateLessonPack(sourcePack);
if (!validation.valid) throw new Error(JSON.stringify(validation.errors));
const pack = validation.pack;
const db = new PGlite();
beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  for (const file of ["20260901010000_create_content_library.sql","20260901030000_create_family_profiles.sql","20260915010000_create_tutor_content.sql","20260915020000_create_tutor_progress.sql","20260915030000_create_tutor_requests.sql"]) await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8").replace("create extension if not exists pgcrypto;",""));
},60000);
afterAll(async () => { await db.close(); });
it("runs the actual reviewed pack through request, import, publish, saved rehearsal and a second generic pack (local SQL, no voice)", async () => {
  const family = (await db.query<{ id: string }>("select id from families limit 1")).rows[0].id;
  const child = (await db.query<{ id: string }>("insert into child_profiles(family_id,display_name,board,grade,pin_salt,pin_hash) values($1,'Pilot','ICSE',6,'s','h') returning id",[family])).rows[0].id;
  async function chapterFor(value: typeof sourcePack | typeof synthetic) {
    const course = (await db.query<{ id: string }>("insert into courses(family_id,fingerprint,board,grade,subject) values($1,$2,$3,$4,$5) returning id",[family,value.lessonId,value.source.board,value.source.grade,value.source.subject])).rows[0].id;
    return (await db.query<{ id: string }>("insert into chapters(course_id,fingerprint,title) values($1,$2,$3) returning id",[course,value.source.chapterId,value.source.chapterTitle])).rows[0].id;
  }
  async function importPack(value: typeof sourcePack | typeof synthetic, chapter: string) {
    const digest = createHash("sha256").update(canonicalPackJSON(value)).digest("hex");
    return (await db.query<{ result: { id: string } }>("select import_tutor_pack($1,$2,$3,$4) as result",[family,chapter,value,digest])).rows[0].result.id;
  }
  const chapter = await chapterFor(sourcePack);
  const request = (await db.query<{ id: string }>("select request_tutor_section($1,$2,null,'Plastids','38','Please explain') as id",[child,chapter])).rows[0].id;
  const section = (await db.query<{ id: string }>("select catalogue_tutor_section($1,$2,'plastids','Plastids','[\"38\"]') as id",[family,chapter])).rows[0].id;
  await db.query("select manage_tutor_request($1,$2,'preparing',$3,null,'')",[family,request,section]);
  const packId = await importPack(sourcePack,chapter);
  await expect(db.query("select manage_tutor_request($1,$2,'ready',null,$3,'')",[family,request,packId])).rejects.toThrow("published");
  await db.query("select manage_tutor_pack($1,$2,'preview')",[family,packId]);
  await db.query("select manage_tutor_pack($1,$2,'publish')",[family,packId]);
  await db.query("select manage_tutor_request($1,$2,'ready',null,$3,'')",[family,request,packId]);
  const progress = (await db.query<{ result: { id: string } }>("select start_tutor_progress($1,$2,$3) as result",[child,packId,initialTutorState()])).rows[0].result.id;
  let state = initialTutorState(); let sequence = 0;
  async function send(value: Pick<TutorCommand,"name"> & Partial<TutorCommand>) {
    const before = state;
    const command = { callId: `pilot-${sequence++}`,stepId: pack.steps[state.stepIndex].id,revision: state.revision,...value };
    state = applyTutorCommand(pack,state,command);
    await db.query("select save_tutor_progress($1,$2,$3,$4)",[child,progress,before.revision,state]);
    return command;
  }
  for (const [index,step] of pack.steps.entries()) {
    await send({ name: "explained" });
    await send({ name: "clarify",target: "cytoplasm" });
    expect(state.phase).toBe("understanding"); expect(state.completed).toHaveLength(index);
    if (index===1) {
      await send({ name: "clarify",target: "chlorophyll-again" });
      const saved = (await db.query<{ state: TutorState }>("select state from tutor_progress where id=$1",[progress])).rows[0].state;
      state = saved; await send({ name: "resume" }); expect(state.stepIndex).toBe(1); expect(state.completed).toHaveLength(1);
      await send({ name: "explained" });
    }
    await send({ name: "ask_checkpoint" });
    await send({ name: "record_checkpoint",answerKind: "choice",answer: "distractor" });
    expect(state.phase).toBe("retry"); expect(state.completed).toHaveLength(index);
    await send({ name: "retry" });
    const accepted = ["3","chlorophyl","cromoplasts","leukoplasts"][index];
    const command = await send({ name: "record_checkpoint",answerKind: "text",answer: accepted });
    expect(applyTutorCommand(pack,state,command)).toBe(state);
    expect(state.completed).toHaveLength(index+1);
    await send({ name: "continue" }); expect(step.checkpoint.id).toBe(state.completed[index]);
  }
  expect(state.phase).toBe("recap"); await send({ name: "finish_lesson" }); expect(state.completed).toHaveLength(4);
  const second = await importPack(synthetic,await chapterFor(synthetic));
  await db.query("select manage_tutor_pack($1,$2,'preview')",[family,second]); await db.query("select manage_tutor_pack($1,$2,'publish')",[family,second]);
  expect((await db.query("select * from tutor_packs where status='published'")).rows).toHaveLength(2);
  expect((await db.query("select * from question_banks")).rows).toHaveLength(0);
});
it("keeps commonly confused plastid names incorrect despite accepted spelling variants", () => {
  let state = { ...initialTutorState(),stepIndex: 2,phase: "checkpoint" as const };
  for (const answer of ["chloroplasts","leucoplasts"]) {
    const result = applyTutorCommand(pack,state,{ callId: answer,revision: 0,stepId: "chromoplasts",name: "record_checkpoint",answerKind: "text",answer });
    expect(result.phase).toBe("retry"); expect(result.completed).toEqual([]);
    state = { ...state };
  }
});
