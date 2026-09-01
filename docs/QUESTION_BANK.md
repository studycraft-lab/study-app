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

## Supported types

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
- `source_group`: shared image/passage with independently scored subquestions.
- `map_work`: base-map reference and expected labels/regions; interaction is deferred until its UI is validated.

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

Questions are not deleted merely because content is out of syllabus. Applicability is stored separately so a question may be active generally but excluded from one exam. Parent edits retain the question `id` and increment its integer `version`; attempts store both values and therefore continue to reference the exact version shown to the child. A newly generated bank also increments `bank.version`.

## Stable import command

After the bank and its review are accepted, start the application with its normal Supabase configuration and import through the existing authenticated API:

```bash
STUDYCRAFT_PARENT_PASSPHRASE='…' npm run chapter:import -- path/to/question-bank.json
```

The command validates and reviews the bank again before calling the application’s shared import route. It does not store credentials or source images in the repository.
