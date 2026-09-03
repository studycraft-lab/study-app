# Question-bank contract

## Purpose

The question bank is the stable boundary between content ingestion and the study application. The family MVP imports Codex-generated JSON; later, automated ingestion must produce the same format.

The canonical structural schema is [`schemas/question-bank.schema.json`](../schemas/question-bank.schema.json). The application validator adds cross-reference and attainable-score checks that JSON Schema cannot express by itself.

## Codex chapter ingestion

Use the repository-local `$chapter-ingestion` skill for textbook images or PDFs. A complete ingestion produces three versioned artifacts:

- a source manifest conforming to [`schemas/chapter-manifest.schema.json`](../schemas/chapter-manifest.schema.json);
- the question-bank JSON;
- a separate grounding and quality review record.

The manifest records source filenames, page/spread bounds, dimensions and SHA-256 hashes without committing copyrighted textbook images or machine-specific absolute paths. The end-of-chapter exercises guide useful question patterns but do not define the full bank.

### Invoking the skill

Open a Codex task in this repository, attach the chapter images or PDF (or provide an accessible source-directory path), and begin the request with `$chapter-ingestion`. Copy-ready prompts for first-version generation, review-only work and later expansion are maintained in [the skill’s prompt reference](../.agents/skills/chapter-ingestion/references/prompts.md).

For the current Early Vedic deliverable, use the review-only prompt. Its committed artifacts remain:

- [`samples/early-vedic-chapter-manifest.json`](../samples/early-vedic-chapter-manifest.json)
- [`samples/early-vedic-question-bank.json`](../samples/early-vedic-question-bank.json), with `bank.version` kept at `3`
- [`samples/early-vedic-question-bank.review.json`](../samples/early-vedic-question-bank.review.json)

Do not use the expansion prompt again until a version beyond `3` is intentionally requested.

Run the deterministic gates with:

```bash
npm run chapter:manifest -- path/to/chapter-manifest.json
npm run chapter:sources -- path/to/chapter-manifest.json --source-dir /local/source/directory
npm run chapter:validate -- path/to/question-bank.json
npm run chapter:review -- path/to/question-bank.json
```

## Versioned envelope

```json
{
  "schemaVersion": "0.1.0",
  "bank": {
    "id": "early-vedic-civilization-v1",
    "version": 1,
    "title": "The Early Vedic Civilization",
    "board": "ICSE",
    "subject": "History",
    "grade": 6,
    "bookTitle": "History and Civics",
    "chapterNumber": 5,
    "status": "draft"
  },
  "sources": [],
  "topics": [],
  "questions": []
}
```

## Source record

Each source identifies the stored page and may define reusable regions such as a map, diagram, illustration, timeline, or source passage.

```json
{
  "id": "page-47",
  "pageNumber": 47,
  "assetRef": "private://chapters/early-vedic/page-47.png",
  "extractionConfidence": 0.98,
  "reviewRequired": false,
  "regions": [
    {
      "id": "political-structure-diagram",
      "kind": "diagram",
      "bounds": { "x": 0.72, "y": 0.05, "width": 0.25, "height": 0.27 }
    }
  ]
}
```

Coordinates are normalized from 0 to 1 so they survive image resizing.

### Source image policy

Do not commit full copyrighted textbook pages to Git. During the Codex MVP, keep originals locally and use `manifest://<chapter>/<page>` as the stable grounding reference. The manifest’s filename and SHA-256 hash allow the exact attachment to be re-verified.

Before a visual question is enabled for a child, upload the required map, diagram, timeline, illustration or passage crop to private application storage and add its `runtimeAssetRef`. Full-page private archival is optional; child delivery should use the smallest necessary crop. Local filesystem paths must never appear in imported bank JSON.

## Common question fields

```json
{
  "id": "q-001",
  "version": 1,
  "type": "multi_point",
  "status": "active",
  "origin": "end_exercise",
  "selectionPriority": 1,
  "topicIds": ["political-organization"],
  "difficulty": 2,
  "marks": 2,
  "prompt": "...",
  "sourceRefs": [
    { "pageId": "page-47", "regionId": null, "supports": ["prompt", "answer", "rubric"] }
  ],
  "response": {},
  "answer": {},
  "rubric": {},
  "hint": "...",
  "explanation": "...",
  "generation": {
    "method": "codex-assisted",
    "generatedAt": "2026-09-01T00:00:00+05:30",
    "validationStatus": "pending"
  }
}
```

`origin` records whether a question came from an `end_exercise`, `chapter_content`, or a `learning_outcome`. `selectionPriority` ranges from 1 (essential) through 3 (reinforcement). New banks provide both fields; they remain optional in schema version 0.1.0 so previously imported banks stay compatible.

While unseen end-exercise questions remain, a ten-question study exercise reserves five places for that pool. Selection still aims for seven objective and three subjective questions. After every end-exercise question has appeared at least once, normal weak/unseen/reinforcement selection resumes, with higher-priority questions preferred within each bucket.

`hint` may be authored for forward compatibility, but the current child experience does not display hints or offer retries.

## Contract and player types

The `type` discriminator controls the response, answer, and rubric shape.

- `single_choice`: options and one correct option ID.
- `multiple_select`: options, correct IDs, and partial-credit policy.
- `fill_blank`: one or more blanks with accepted normalized answers.
- `true_false_correct`: boolean answer plus correction required when false.
- `matching`: left/right items and correct pairs.
- `one_word`: accepted terms and spelling policy.
- `brief_answer`: expected concepts and concise-answer guidance.
- `multi_point`: independently weighted required/optional points.
- `compare`: named comparison dimensions with points for each side.
- `source_group`: shared image/passage with independently scored subquestions; stored by the contract but not yet playable.
- `map_work`: base-map reference and expected labels/regions; stored by the contract but not yet playable.

The current player supports the first nine types, from `single_choice` through `compare`. It excludes disabled questions and does not expose answers or rubrics before submission.

## Multi-point rubric example

```json
{
  "type": "multi_point",
  "marks": 2,
  "prompt": "How did the political system ensure that the rajan was not an absolute ruler?",
  "answer": {
    "ideal": "The sabha and samiti exercised control over the rajan. The samiti allowed members of the tribe to express opinions, while the smaller sabha advised and guided the king."
  },
  "rubric": {
    "points": [
      { "id": "p1", "concept": "sabha and samiti controlled the rajan", "weight": 0.75, "required": true },
      { "id": "p2", "concept": "samiti was a larger assembly where tribal members could give opinions", "weight": 0.75, "required": true },
      { "id": "p3", "concept": "sabha was a smaller assembly that advised and guided the king", "weight": 0.5, "required": true }
    ],
    "spellingAffectsScore": true,
    "grammarAffectsScore": false,
    "uncertainBelowConfidence": 0.7
  },
  "sourceRefs": [{ "pageId": "page-47", "supports": ["prompt", "answer", "rubric"] }]
}
```

## Validation rules

An import fails when:

- IDs or referenced pages/topics do not exist.
- Marks do not equal the rubric's attainable score.
- An objective question has no deterministic correct answer.
- A scored claim lacks a source reference.
- A source-group subquestion lacks the group source.
- Question type data does not match its discriminator.

An import warns when:

- Source extraction confidence is low.
- Two questions appear semantically duplicative.
- An expected answer is much broader than its cited pages.
- A multi-point question has too few independently scorable points.

## Scope and lifecycle

Questions should not be deleted merely because content is out of syllabus. Exam applicability and out-of-syllabus controls are planned but are not represented in the current database yet. Attempts already store question and bank versions so future edits can continue to reference the exact item shown to the child. Today, disabling a reported question creates a new bank version and retains the question snapshot in historical attempts.

There is one guarded replacement path for correcting a prototype import: when the stored bank is still `draft` and has no study sessions, attempts or review items, importing different content with the same bank ID and version replaces that row in place. This lets an incomplete draft such as a 12-question prototype be superseded by its reviewed v1 bank without leaving duplicate chapter entries. Once a bank is non-draft or has study history, it is immutable and changed content needs a higher `bank.version`.

Authors should still increment `bank.version` for an intentional new release. The parent upload preview displays the selected bank version and question count before import. As a safety net, the shared import route automatically advances through occupied immutable versions and imports at the first compatible version; consecutive collisions are handled without asking the parent to edit JSON. The response reports `requestedVersion`, `importedVersion`, and `versionAdjusted`, and an identical bank already stored at an advanced version remains idempotent rather than being duplicated.

## Stable import command

After the bank and its review are accepted, start the application with its normal Supabase configuration and import through the existing authenticated API:

```bash
STUDYCRAFT_PARENT_PASSPHRASE='…' npm run chapter:import -- path/to/question-bank.json
```

The command validates and reviews the bank again before calling the application’s shared import route. Its JSON result shows the effective imported version, including any automatic version advance. It does not store credentials or source images in the repository.
