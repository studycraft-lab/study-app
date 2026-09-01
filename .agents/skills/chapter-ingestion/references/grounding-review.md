# Grounding and quality review

Run this review only after the manifest, source hashes, bank schema, references, and rubric totals pass deterministic checks.

## Coverage

- Map each printed learning outcome to at least one topic and at least two questions where the source supports that depth.
- Check prose, captions, diagrams, maps, timelines, tables, callouts, and end exercises. Exercises supply patterns and important concepts but do not cap coverage.
- Check the distribution of recall, understanding, application, comparison, and source interpretation. Do not invent an examination blueprint.

## Question-by-question grounding

For every question, open each cited page and region and confirm:

1. the prompt can be answered using only the cited material;
2. every accepted answer and distractor classification is supported;
3. every scored rubric concept is present in the cited material;
4. the hint and explanation do not add unsupported claims;
5. the mark total equals the attainable rubric score;
6. wording is age-appropriate and does not reveal the answer accidentally.

For source groups, also confirm that the visual or passage is necessary and that each subquestion is independently scored. For maps and timelines, verify labels, dates, directions, and normalized region bounds visually.

## Review record

Store a JSON review record beside the bank with:

- bank ID, version, review date, and reviewer method;
- structural and deterministic review command results;
- coverage counts by topic, type, difficulty, and page;
- source-asset readiness for child-visible visual questions;
- blocking findings and advisory notes;
- decision: `accept`, `revise`, or `reject`.

Use `accept` only when blocking findings are empty. A missing private runtime asset can be advisory while the application does not serve that question type, but it becomes blocking before the visual question is enabled for children.
