import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ adminClient: () => ({ from: mock.from }) }));
import { chapterCoverage } from "./store";
const question = {id:"nucleus",version:1,type:"single_choice",prompt:"What controls cell activities?"};
let tables: Record<string, Record<string,unknown>[]>;
beforeEach(() => {
  tables = {
    question_banks: [
      {id:"old",chapter_id:"cell",external_id:"cell-bank",payload:{questions:[question]}},
      {id:"current",chapter_id:"cell",external_id:"cell-bank",payload:{questions:[question]}},
    ],
    study_attempts: [{child_id:"child",question_bank_id:"old",question_id:"nucleus",question_version:1,correct:true,earned_marks:1,max_marks:1,grading_status:"graded"}],
  };
  mock.from.mockImplementation((table:string) => {
    let rows=tables[table];
    const query = {select:()=>query,order:()=>query,range:(start:number,end:number)=>{rows=rows.slice(start,end+1);return query;},eq:(key:string,value:unknown)=>{rows=rows.filter(r=>r[key]===value);return query;},in:(key:string,values:unknown[])=>{rows=rows.filter(r=>values.includes(r[key]));return query;},then:(resolve:(r:unknown)=>unknown)=>Promise.resolve({data:rows,error:null}).then(resolve)};
    return query;
  });
});
it("preserves coverage of unchanged questions when a chapter bank is replaced", async () => {
  expect((await chapterCoverage("child",["current"])).current).toEqual({questionCount:1,correctEver:1,coveragePercent:100,fullCoverage:true});
});
it.each([
  {...question,version:2}, {...question,prompt:"A different question"}, {...question,status:"disabled"},
])("does not inherit credit for a changed or disabled question: %j", async changed => {
  tables.question_banks[1].payload={questions:[changed]};
  expect((await chapterCoverage("child",["current"])).current.correctEver).toBe(0);
});
it("counts repeated correct attempts once, including parent-adjusted scores", async () => {
  tables.study_attempts = [tables.study_attempts[0],{...tables.study_attempts[0],question_bank_id:"current",correct:false,adjusted_correct:true,adjusted_earned_marks:1}];
  expect((await chapterCoverage("child",["current"])).current.correctEver).toBe(1);
  tables.study_attempts.shift();
  expect((await chapterCoverage("child",["current"])).current.correctEver).toBe(1);
});
it.each([
  {child_id:"sibling"}, {grading_status:"pending_review"}, {question_version:2},
])("does not count unrelated or ungraded attempts: %j", async changes => {
  Object.assign(tables.study_attempts[0],changes);
  expect((await chapterCoverage("child",["current"])).current.correctEver).toBe(0);
});
it.each([{chapter_id:"another-chapter"},{external_id:"unrelated-bank"}])("isolates question IDs by bank lineage: %j", async changes => {
  Object.assign(tables.question_banks[0],changes);
  expect((await chapterCoverage("child",["current"])).current.correctEver).toBe(0);
});
it("reads beyond the first thousand attempts", async () => {
  const correct=tables.study_attempts[0];
  tables.study_attempts=[...Array.from({length:1000},()=>({...correct,correct:false})),correct];
  expect((await chapterCoverage("child",["current"])).current.correctEver).toBe(1);
});
