# Question-bank contract

## Purpose

The question bank is the stable boundary between content ingestion and the study application. The family MVP imports Codex-generated JSON; later, automated ingestion must produce the same format.

## Versioned envelope

```json
{
  "schemaVersion": "0.1.0",
  "bank": {
    "id": "early-vedic-civilization-v1",
    "title": "The Early Vedic Civilization",
    "subject": "History",
    "grade": 6,
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

## Common question fields

```json
{
  "id": "q-001",
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

Questions are not deleted merely because content is out of syllabus. Applicability is stored separately so a question may be active generally but excluded from one exam. Parent edits create a new question version; attempts continue to reference the exact version shown to the child.

