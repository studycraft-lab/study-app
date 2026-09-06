# Ingestion artifacts

This directory contains versioned StudyCraft content deliverables produced by chapter ingestion. The files are real source manifests, question banks and grounding-review records; they are not sample data, test fixtures or disposable build output.

For each chapter, keep the three related files together using the chapter slug:

- `<slug>-chapter-manifest.json`
- `<slug>-question-bank.json`
- `<slug>-question-bank.review.json`

The source manifest records the identity and hashes of local source pages. The question bank is the importable application content. The review record captures the grounding and quality decision for that bank. Do not commit textbook page images, local absolute paths, credentials or imported database exports here.

Follow [`docs/QUESTION_BANK.md`](../docs/QUESTION_BANK.md) and the repository-local [`chapter-ingestion` skill](../.agents/skills/chapter-ingestion/SKILL.md) when creating or revising these files. Treat a reviewed bank version as immutable: make factual corrections according to the documented review workflow, and create a new bank version for an intentional content expansion.

## Repository ownership

These artifacts currently live with the application because the schema, validators, import tooling and representative-corpus tests evolve with them. This keeps content contract changes atomic and avoids an external checkout during CI.

Move the directory to a dedicated repository under the same organization when at least one of these becomes true:

- content requires different access controls from application source;
- content and application releases need independent ownership or release cadence;
- repository size or artifact volume materially affects normal development;
- multiple applications consume the same independently versioned corpus.

Before such a split, replace application tests that import files from this directory with small purpose-built fixtures. Publish or pin a content revision for validation and import jobs, then update this README, the root README, `docs/QUESTION_BANK.md`, the chapter-ingestion prompts and CI configuration in the same change.
