import Ajv from "ajv";
import schema from "../../../schemas/lesson-pack.schema.json";
import type { LessonPack } from "./types";

export const MAX_PACK_BYTES = 256 * 1024;
const check = new Ajv({ allErrors: true, strict: false }).compile<LessonPack>(schema);
export type PackValidation = { valid: true; pack: LessonPack; errors: [] } | { valid: false; pack: null; errors: string[] };

export function validateLessonPack(input: unknown): PackValidation {
  const fail = (errors: string[]): PackValidation => ({ valid: false, pack: null, errors });
  let serialized: string;
  try { serialized = JSON.stringify(input); } catch { return fail(["/: Expected finite JSON data."]); }
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_PACK_BYTES) return fail(["/: Pack exceeds 256 KiB or is not JSON data."]);
  if (typeof input === "object" && input !== null && "schemaVersion" in input && input.schemaVersion !== "1.0") return fail(["/schemaVersion: Unsupported schema version; this player supports 1.0. Re-export using the v1 contract."]);
  if (!check(input)) return fail((check.errors ?? []).map(e => `${e.instancePath || "/"}${e.keyword === "additionalProperties" ? `/${e.params.additionalProperty}` : ""}: ${e.message}.`));
  const errors: string[] = [];
  const ids = (items: { id: string }[], path: string) => {
    const seen = new Set<string>();
    items.forEach((item, i) => { if (seen.has(item.id)) errors.push(`${path}/${i}/id: Duplicate ID ${item.id}.`); seen.add(item.id); });
    return seen;
  };
  const refs = (values: string[], targets: Set<string>, path: string) => values.forEach((id, i) => { if (!targets.has(id)) errors.push(`${path}/${i}: Unknown ID ${id}.`); });
  const citations = ids(input.citations, "/citations");
  const facts = ids(input.facts, "/facts");
  const scenes = ids(input.scenes, "/scenes");
  ids(input.steps, "/steps"); ids(input.steps.map(s => s.checkpoint), "/checkpoints"); ids(input.clarifications, "/clarifications");
  input.citations.forEach((c, i) => {
    if (!input.section.printedPages.includes(c.printedPage)) errors.push(`/citations/${i}/printedPage: Outside section pages.`);
    if (c.pdfPage !== null && !input.section.pdfPages.includes(c.pdfPage)) errors.push(`/citations/${i}/pdfPage: Outside section PDF pages.`);
  });
  input.facts.forEach((f, i) => refs(f.citationIds, citations, `/facts/${i}/citationIds`));
  input.scenes.forEach((scene, i) => {
    const elementIds = ids(scene.elements, `/scenes/${i}/elements`);
    const parents = new Set<string>();
    scene.elements.forEach((e, j) => {
      if (e.kind !== "group") return;
      refs(e.children, elementIds, `/scenes/${i}/elements/${j}/children`);
      e.children.forEach(child => {
        if (scene.elements.find(el => el.id === child)?.kind === "group" || parents.has(child)) errors.push(`/scenes/${i}/elements/${j}/children: Groups cannot nest or share children.`);
        parents.add(child);
      });
    });
    scene.elements.forEach((e, j) => {
      if (e.kind === "path") {
        const coordinates = e.d.match(/-?\d+(?:\.\d+)?/g) ?? [];
        if (!/^[Mm]/.test(e.d) || coordinates.length === 0 || coordinates.some(n => Math.abs(Number(n)) > 2000)) errors.push(`/scenes/${i}/elements/${j}/d: Path must start with move and use coordinates within ±2000.`);
      }
    });
  });
  input.steps.forEach((step, i) => {
    const path = `/steps/${i}`;
    refs(step.factIds, facts, `${path}/factIds`); refs([step.sceneId], scenes, `${path}/sceneId`);
    const elements = new Set(input.scenes.find(s => s.id === step.sceneId)?.elements.map(e => e.id));
    refs(step.focusIds, elements, `${path}/focusIds`);
    step.actions.forEach((a, j) => {
      refs([a.target], elements, `${path}/actions/${j}/target`);
      if (a.kind === "move" ? a.dx === undefined || a.dy === undefined : a.dx !== undefined || a.dy !== undefined) errors.push(`${path}/actions/${j}: Only move requires dx and dy.`);
    });
    const options = ids(step.checkpoint.options, `${path}/checkpoint/options`);
    refs([step.checkpoint.correctOptionId], options, `${path}/checkpoint/correctOptionId`);
    if (step.nextStepId !== (input.steps[i + 1]?.id ?? null)) errors.push(`${path}/nextStepId: Steps must advance in array order, ending in null.`);
  });
  input.clarifications.forEach((c, i) => refs(c.factIds, facts, `/clarifications/${i}/factIds`));
  refs(input.recap.factIds, facts, "/recap/factIds"); refs([input.recap.sceneId], scenes, "/recap/sceneId");
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string" && /(?:https?:\/\/|javascript\s*:|data\s*:|url\s*\(|on\w+\s*=)/i.test(value)) errors.push(`${path}: External resources or executable payloads are unsupported.`);
    else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => walk(item, `${path}/${key}`));
  };
  walk(input, "");
  return errors.length ? fail(errors) : { valid: true, pack: input, errors: [] };
}

/** Object key order is irrelevant; array order is pedagogically significant. */
export function canonicalPackJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalPackJSON).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonicalPackJSON(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
