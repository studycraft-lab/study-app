# Plastids v1 source review

Status: **source reviewed; integrated voice pilot not accepted**. Prepared and visually checked by Codex on 2026-09-15. This is an external authoring deliverable for parent preview, not runtime generation or a claim of independent human review.

## Source identity

- File: `Biology The Cell.pdf`, 77,497,067 bytes, 12 scanned pages.
- Supplied source: [Drive link in issue #50](https://drive.google.com/file/d/16b4_Ze3d4L8yVG0fkps1od7BPOctPmHI/view).
- SHA-256: `e25dea1fb949b0107b918a6d96c8d0f4b8d0ffb5902ffd8c7923b0cbea20e269`.
- Main source: printed **38**, PDF **5** (1-based), left column, Plastids subsection beneath Cell organelles. Verified from the rendered scan, not inferred from the issue outline.
- Clarification only: printed **37**, PDF **4**, Cytoplasm definition. The lesson remains Plastids; this adjacent definition supports “what does cytoplasm mean?”.
- Book title and edition: not established from this excerpt; null. ICSE, Grade 6, Biology are the parent's issue metadata. They are not independently established from the scanned cover, which is absent.
- Section catalogue uses chapter → exact section heading: `The Cell / Plastids`. The source's containing heading is Cell organelles. The four teaching steps are internal, not four requestable sections.

## Coverage reviewed

| Pack content | Source and decision |
| --- | --- |
| Introduction, paired membrane outlines, plant-cell location, absent in animals, three types | p38 Plastids opening paragraph; original simplified diagram represents location and two membranes, not ultrastructure or scale. |
| Green chloroplast, chlorophyll, sunlight arrow, photosynthesis mention | p38 Chloroplasts paragraph. Omit internal stacks, ATP and photosynthesis chemistry. The arrow is symbolic. |
| Red/yellow/orange chromoplast examples and flower/fruit colour | p38 Chromoplasts paragraph. These are examples of pigments, not additional plastid types. |
| Colourless leucoplast, starch/proteins/oils, mostly seeds | p38 Leucoplasts paragraph. White is a diagram convention for no pigment, not a claim of white pigment. |
| Cytoplasm clarification | p37 opening definition; brief paraphrase. No additional organelle lesson. |
| Two membranes and repeat-chlorophyll clarifications | Repeat already approved p38 facts; no outside knowledge. |
| Four questions, choices, accepted variants, criteria, hints, simpler narration, encouragement and recap | Compared against the same cited paragraphs. Incorrect choices are distractors, not asserted facts. Encouragement is formative feedback, not source content. |

All five scenes are original declarative primitives, with bounded pulse/move effects. No scans, copied textbook diagrams, executable SVG or external assets are embedded. Every factual lesson element was checked against the two rendered source pages. “Most conspicuous” is omitted because it is unnecessary for these checkpoints. The final recap compares the same three types.

Accepted spelling variants are bounded. The tests specifically reject chloroplasts/leucoplasts as answers for chromoplasts. Rehearsal uses deterministic matching; voice interpretation is model-assessed and must be tested separately. Four stars indicate completed formative checkpoints, not exam mastery.

## Verification and remaining review

`v1.json` passes the shared validator. The integration test executes import, preview/publication state transitions, request fulfilment and saved four-step rehearsal in local PGlite, including wrong answer/retry, clarification, spelling variants, interruption/resume and a second synthetic pack. This does **not** demonstrate authenticated deployed UI interaction or real voice.

The POC ZIP was unavailable; no claim of POC comparison is made. Parent preview, real provider/device observations, hosted concurrent starts/termination, and parent acceptance remain pending in `docs/tutor/PILOT.md`. The unverified fixture in `examples/lesson-packs` remains explicitly unverified and is not this deliverable.

For a correction, increment `contentVersion`, retain stable identities where meanings are unchanged, validate/review again, and import/preview/publish through the parent library. Existing progress remains pinned to its immutable version.
