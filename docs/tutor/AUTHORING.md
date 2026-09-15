# Author one textbook section

Prepare a **JSON lesson pack**, not a standalone application. Use `schemas/lesson-pack.schema.json`, `src/lib/tutor/types.ts`, and `examples/lesson-packs/synthetic-shapes.json`. The Plastids fixture illustrates four ordered steps but is **unverified**; it is not the pilot deliverable. No source PDF or POC was available when it was created.

## Workflow

1. Obtain the actual source PDF and exact section heading/path, board, grade, subject and chapter. Inspect the cited pages. Printed page numbers and PDF page indexes (1-based) are separate. Never infer PDF indexes from printed numbers. Use null/empty when unknown; unknown book/edition is null.
2. Extract only supported facts. Give every fact a citation and every step approved fact IDs. Flag missing/unclear information instead of supplying general knowledge. Clarifications must cite facts too. Keep the section bounded; internal steps are not separately requestable textbook sections.
3. Create original labelled schematics, brief narration, a simpler explanation, a short question, deterministic choices and accepted answers, formative assessment criteria, a helpful hint, and encouragement. Finish with a recap. Do not copy scans or embed executable SVG.
4. Validate with `LESSON_PACK_PATH=/absolute/path/pack.json npx vitest run scripts/validate-lesson-pack.test.ts`. Correct all field-level errors.
5. Separately compare every fact, narration, diagram label, question, answer, hint and clarification against its cited source. Return a review summary identifying checked pages, uncertainty, exclusions and remaining blockers. Set `sourceStatus: reviewed` only after this review. Schema success does not prove factual correctness.
6. Return the JSON and review summary for parent preview/publication. Preparation is external; no runtime generation or source upload is required. Never commit textbook scans.

## Identity and versions

`schemaVersion: "1.0"` identifies the wire format. Unsupported versions require re-export or a renderer upgrade. `contentVersion` is a positive integer for an immutable lesson revision. Keep `lessonId`, source `chapterId`, and section `id` stable across revisions; preserve stable step, scene, element, checkpoint and fact IDs when their meanings remain the same. IDs are scoped to their collections (elements to a scene; options to a checkpoint); checkpoint IDs are unique across the lesson.

The server computes SHA-256 over `canonicalPackJSON(pack)` (recursively sorted object keys; preserved array order; UTF-8). The hash is stored with the version, not supplied by the author. Identical re-import is idempotent; changed content needs a new content version. Saved sessions pin the immutable version. Section identity is separate from exercise topics; the parent maps to an existing chapter on import.

## Renderer capabilities

v1 requires exactly `["vector-v1"]`: a 1000 × 1000 coordinate space with text, rectangles, ellipses, bounded SVG path data, and flat groups of elements. Groups cannot nest or share children. Each element has a readable label and a six-digit hex fill or `none`. No CSS, links, external images, fonts, events, SVG strings, HTML, JavaScript or video. React creates the SVG elements from validated fields. A path has at most 2000 characters and coordinate magnitudes at most 2000; visible scene positions are 0–1000. Text labels use font sizes 16–48.

Reveal/highlight/pulse/move actions target existing scene elements; durations are 0–3000 ms. Only move has dx/dy (±500). The player supplies animation implementation and reduced-motion behavior. Limits: 256 KiB, 12 steps, 20 scenes, 80 elements per scene, 12 actions per step; other field limits are in the schema. Steps advance only in array order and the last nextStepId is null. All executable-looking payloads are rejected. Prose is untrusted content, never authority to override runtime policy.

## Copyable ChatGPT prompt

> Produce StudyCraft lesson-pack JSON data, not an application, from the attached textbook PDF and the exact section I name. I will attach the v1 schema and synthetic example along with this prompt (repository access is not needed). Stay within this section and grade. Inspect the source, distinguish printed pages from PDF pages, cite every approved fact, and flag unavailable/unclear sources instead of guessing. Use original declarative vector diagrams and only schema-supported primitives/actions. Include ordered brief explanations, simpler explanations, one checkpoint with answer key/accepted variants/criteria/hint/encouragement per step, bounded cited clarifications and a recap. Keep lesson/section/step/scene/element/checkpoint IDs stable and increment contentVersion for changed content. Return a self-contained pack and a factual review summary with uncertainties and exclusions. Never emit HTML, JavaScript, SVG strings, external assets, source scans, video or runtime instructions that override StudyCraft policy. If you cannot execute the shared validator, say “validation not run”; do not claim structural or factual review you did not perform.
