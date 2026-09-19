import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import pack from "../../examples/lesson-packs/synthetic-shapes.json";
import { ParentTutorLibrary } from "./parent-tutor-library";
vi.mock("./app-header",()=>({AppHeader:()=> <header>Parent</header>}));
vi.mock("./tutor-voice-controls",()=>({ParentVoicePermission:()=>null}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("guides request → prompt → upload → preview → publish without manual mapping",async()=>{
  let uploaded=false,previewed=false,published=false;
  const row=()=>({id:"pack",chapter_id:"chapter",heading:"Squares",chapter_title:"Shapes",content_version:1,status:published?"published":"draft",previewed_at:previewed?"now":null,payload:pack});
  const calls:unknown[]=[];
  vi.stubGlobal("fetch",vi.fn(async(url:string,options?:RequestInit)=>{
    if(url.includes("preparation?"))return Response.json({prompt:"Complete schema and requested Squares lesson prompt"});
    if(url.endsWith("/requests"))return Response.json({chapters:[{id:"chapter",title:"Shapes",courses:{subject:"Geometry"}}],requests:[{id:"request",chapter_id:"chapter",proposed_heading:"Squares",child_profiles:{display_name:"Learner"},status:published?"ready":uploaded?"preparing":"requested",pack_id:uploaded?"pack":null,available:published}]});
    if(options?.method==="POST"){calls.push(JSON.parse(String(options.body)));uploaded=true;return Response.json({id:"pack",created:true});}
    if(options?.method==="PATCH"){const body=JSON.parse(String(options.body)); if(body.action==="preview")previewed=true; if(body.action==="publish")published=true;return Response.json({updated:true});}
    return Response.json({chapters:[],packs:uploaded?[row()]:[]});
  }));
  render(<ParentTutorLibrary/>);
  fireEvent.click(await screen.findByRole("button",{name:"Prepare lesson"}));
  await waitFor(()=>expect(screen.getByRole("button",{name:"Copy Codex prompt"})).toBeEnabled());
  expect(screen.queryByText("Mark preparing")).not.toBeInTheDocument();
  expect(screen.queryByText("Add a textbook section")).not.toBeInTheDocument();
  const file=new File([JSON.stringify(pack)],"lesson.json",{type:"application/json"});
  Object.defineProperty(file,"text",{value:async()=>JSON.stringify(pack)});
  fireEvent.change(screen.getByLabelText("Lesson file"),{target:{files:[file]}});
  expect(await screen.findByRole("region",{name:"Scripted lesson preview"})).toBeVisible();
  expect(calls).toEqual([{requestId:"request",pack}]);
  const publish=await screen.findByRole("button",{name:"Publish Squares v1"});
  await waitFor(()=>expect(publish).toBeEnabled()); fireEvent.click(publish);
  expect(await screen.findByText("Ready for child")).toBeVisible();
});
