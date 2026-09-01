#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv from "ajv";
import addFormats from "ajv-formats";

const repositoryRoot = resolve(fileURLToPath(new URL("../../../../", import.meta.url)));
const schemaPaths = {
  bank: join(repositoryRoot, "schemas/question-bank.schema.json"),
  manifest: join(repositoryRoot, "schemas/chapter-manifest.schema.json"),
};

function usage(message) {
  if (message) console.error(message);
  console.error(`Usage:
  chapter-ingestion.mjs validate-manifest <manifest>
  chapter-ingestion.mjs check-sources <manifest> --source-dir <directory>
  chapter-ingestion.mjs validate-bank <bank>
  chapter-ingestion.mjs review-bank <bank>
  chapter-ingestion.mjs normalize-bank <bank> --output <path>
  chapter-ingestion.mjs import-bank <bank> [--url http://localhost:3000]`);
  process.exit(2);
}

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function json(path) {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8"));
  } catch (error) {
    throw new Error(`${path}: ${error instanceof Error ? error.message : "could not read JSON"}`);
  }
}

async function validator(kind) {
  const schema = await json(schemaPaths[kind]);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function formatSchemaErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "root"} ${error.message}`).join("\n");
}

async function validate(kind, value) {
  const check = await validator(kind);
  if (!check(value)) throw new Error(formatSchemaErrors(check.errors));
}

function records(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item)) : [];
}

function pointTotal(value) {
  const points = records(value);
  return points.length && points.every((point) => typeof point.weight === "number")
    ? points.reduce((sum, point) => sum + point.weight, 0)
    : null;
}

function attainableMarks(question) {
  if (question.type === "matching") return records(question.answer?.pairs).length * Number(question.rubric?.pointsPerPair);
  if (question.type === "source_group") {
    const totals = records(question.rubric?.subrubrics).map((entry) => pointTotal(entry.points));
    return totals.length && totals.every((total) => total !== null) ? totals.reduce((sum, total) => sum + total, 0) : null;
  }
  if (["true_false_correct", "brief_answer", "multi_point", "compare", "map_work"].includes(question.type)) {
    const total = pointTotal(question.rubric?.points);
    return total === null ? null : Math.min(total, question.rubric?.maximumPoints ?? total);
  }
  return question.marks;
}

function reviewBank(bank) {
  const errors = [];
  const warnings = [];
  const sourceIds = new Set();
  const regionIds = new Map();
  const topicIds = new Set();
  const questionIds = new Set();
  const prompts = new Map();

  for (const source of records(bank.sources)) {
    if (sourceIds.has(source.id)) errors.push(`Duplicate source id ${source.id}.`);
    sourceIds.add(source.id);
    regionIds.set(source.id, new Set(records(source.regions).map((region) => region.id)));
  }
  for (const topic of records(bank.topics)) {
    if (topicIds.has(topic.id)) errors.push(`Duplicate topic id ${topic.id}.`);
    topicIds.add(topic.id);
  }
  for (const question of records(bank.questions)) {
    if (questionIds.has(question.id)) errors.push(`Duplicate question id ${question.id}.`);
    questionIds.add(question.id);
    for (const topicId of question.topicIds ?? []) if (!topicIds.has(topicId)) errors.push(`${question.id} cites missing topic ${topicId}.`);
    const supports = new Set();
    for (const ref of records(question.sourceRefs)) {
      if (!sourceIds.has(ref.pageId)) errors.push(`${question.id} cites missing source ${ref.pageId}.`);
      if (ref.regionId && !regionIds.get(ref.pageId)?.has(ref.regionId)) errors.push(`${question.id} cites missing region ${ref.regionId}.`);
      for (const claim of ref.supports ?? []) supports.add(claim);
    }
    for (const claim of ["prompt", "answer", "rubric"]) if (!supports.has(claim)) errors.push(`${question.id} lacks ${claim} grounding.`);
    const attainable = attainableMarks(question);
    if (attainable !== null && Math.abs(question.marks - attainable) > 0.0001) errors.push(`${question.id} has ${question.marks} marks but ${attainable} attainable rubric points.`);
    const normalized = question.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (prompts.has(normalized)) warnings.push(`${question.id} duplicates ${prompts.get(normalized)}.`);
    else prompts.set(normalized, question.id);
  }
  const counts = {
    questions: records(bank.questions).length,
    topics: Object.fromEntries([...topicIds].map((id) => [id, records(bank.questions).filter((question) => question.topicIds?.includes(id)).length])),
    types: Object.fromEntries([...new Set(records(bank.questions).map((question) => question.type))].map((type) => [type, records(bank.questions).filter((question) => question.type === type).length])),
    difficulties: Object.fromEntries([1, 2, 3].map((difficulty) => [difficulty, records(bank.questions).filter((question) => question.difficulty === difficulty).length])),
  };
  return { valid: errors.length === 0, errors, warnings, counts };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function normalizeBank(bank) {
  return stable({
    ...bank,
    sources: [...bank.sources].sort((a, b) => a.pageNumber - b.pageNumber).map((source) => ({ ...source, regions: [...source.regions].sort((a, b) => a.id.localeCompare(b.id)) })),
    topics: [...bank.topics].sort((a, b) => a.id.localeCompare(b.id)),
    questions: [...bank.questions].sort((a, b) => a.id.localeCompare(b.id)),
  });
}

async function checkSources(manifest, sourceDir) {
  const errors = [];
  for (const asset of manifest.assets) {
    const path = join(resolve(sourceDir), asset.fileName);
    try {
      const digest = createHash("sha256").update(await readFile(path)).digest("hex");
      if (digest !== asset.sha256) errors.push(`${asset.fileName}: expected ${asset.sha256}, found ${digest}.`);
    } catch (error) {
      errors.push(`${asset.fileName}: ${error instanceof Error ? error.message : "could not read source"}`);
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
}

const command = process.argv[2];
const input = process.argv[3];
if (!command || !input) usage();

try {
  if (command === "validate-manifest") {
    await validate("manifest", await json(input));
    console.log(`Valid chapter manifest: ${basename(input)}`);
  } else if (command === "check-sources") {
    const manifest = await json(input);
    await validate("manifest", manifest);
    const sourceDir = option("--source-dir");
    if (!sourceDir) usage("--source-dir is required.");
    await checkSources(manifest, sourceDir);
    console.log(`Verified ${manifest.assets.length} source asset(s).`);
  } else if (command === "validate-bank") {
    const bank = await json(input);
    await validate("bank", bank);
    console.log(`Valid question-bank schema: ${bank.questions.length} question(s).`);
  } else if (command === "review-bank") {
    const bank = await json(input);
    await validate("bank", bank);
    const review = reviewBank(bank);
    console.log(JSON.stringify(review, null, 2));
    if (!review.valid) process.exitCode = 1;
  } else if (command === "normalize-bank") {
    const bank = await json(input);
    await validate("bank", bank);
    const output = option("--output");
    if (!output) usage("--output is required.");
    await writeFile(resolve(output), `${JSON.stringify(normalizeBank(bank), null, 2)}\n`);
    console.log(`Normalized bank written to ${output}.`);
  } else if (command === "import-bank") {
    const bank = await json(input);
    await validate("bank", bank);
    const review = reviewBank(bank);
    if (!review.valid) throw new Error(review.errors.join("\n"));
    const passphrase = process.env.STUDYCRAFT_PARENT_PASSPHRASE;
    if (!passphrase) throw new Error("STUDYCRAFT_PARENT_PASSPHRASE is required.");
    const baseUrl = option("--url", "http://localhost:3000").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/api/question-banks/import`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-studycraft-parent-passphrase": passphrase },
      body: JSON.stringify({
        bank,
        metadata: {
          board: bank.bank.board,
          grade: bank.bank.grade,
          subject: bank.bank.subject,
          bookTitle: bank.bank.bookTitle,
          chapterNumber: bank.bank.chapterNumber,
          chapterTitle: bank.bank.title,
        },
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    console.log(JSON.stringify(result, null, 2));
  } else usage(`Unknown command ${command}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
