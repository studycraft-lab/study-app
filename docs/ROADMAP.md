# Roadmap

This is intentionally short. GitHub issues will hold implementation detail when work begins.

## Milestone 0 — Validate the learning model

- Finalize the product brief and question-bank contract.
- Create a representative bank from textbook pages 45–53.
- Include objective, brief, multi-point, source-based, timeline/diagram, and map-work examples.
- Review question quality, citations, partial-credit rubrics, and expected child feedback.

**Exit:** We can represent the real chapter without special-case data structures, and the parent accepts the sample questions and scoring rubrics.

## Milestone 1 — Usable family quiz

- Scaffold the responsive PWA and automated checks.
- Provision Supabase and Vercel environments.
- Add family, parent, and child profiles.
- Add subjects, chapters, sources, topics, and bank import.
- Build the one-question-at-a-time player and deterministic scoring.

**Exit:** Each child can independently complete an imported chapter quiz on a tablet.

## Milestone 2 — Learning loop

- Track attempts, coverage, accuracy, and topic mastery.
- Add mistake review and spaced repetition.
- Add hints, immediate retry, explanations, skipping, and 20-minute sessions.
- Add child flags and parent question controls.
- Add personal stars, streaks, and levels.

**Exit:** The app reliably brings back weak material and shows useful parent progress.

## Milestone 3 — Subjective understanding

- Add provider-neutral AI routing and family-level credentials.
- Grade brief and multi-point answers against structured rubrics.
- Return numeric marks, simple verdicts, covered/missing points, and confidence.
- Add typed answers first; voice transcription and transcript correction second.

**Exit:** Real Grade 6 answers are graded consistently enough for supervised family use, with ambiguous cases clearly flagged.

## Milestone 4 — Exam preparation

- Add exam scopes and out-of-syllabus exclusions.
- Add reusable paper-pattern definitions.
- Compose exercises from selected chapters and patterns.
- Later, extract patterns from uploaded sample papers.

**Exit:** A parent can create an exam-ready exercise without generating unsupported facts.

## Milestone 5 — Automated ingestion

- Upload textbook photos and PDFs inside the app.
- Extract text and understand diagrams, tables, maps, and page regions.
- Flag uncertain pages.
- Generate and independently validate a bank before publishing it.

**Exit:** A parent can go from chapter photos to a traceable usable bank with minimal intervention.

