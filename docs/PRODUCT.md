# Product brief

## Product outcome

Help children revise textbook chapters deeply through focused, motivating practice. Content is shared within the family; every child's sessions, answers, and progress remain independent.

## Current boundary

StudyCraft is a hosted, online, single-family MVP for English-medium subjects. Board, grade, subject, and chapter are data attributes rather than hard-coded product variants. The first content is ICSE Grade 3 and Grade 6, but the application does not depend on those grades.

The parent and each child sign in separately. There is no role switching inside an authenticated session. A platform-admin option is visible but intentionally inactive until multi-family onboarding exists.

## Current parent journey

1. Sign in with the configured family password.
2. Create or maintain child profiles with name, board, grade, and PIN.
3. Generate a grounded question bank outside the app with the repository's chapter-ingestion skill.
4. Upload the JSON, validate it, confirm its metadata, and import it.
5. Review child-reported questions and either dismiss the report or disable the item in a new bank version.
6. View concise learning activity or purge an invalid session.

## Current child journey

1. Sign in independently with name and PIN.
2. See chapters matching the profile's board and grade.
3. Start a random exercise or resume an unfinished one.
4. Answer every question and submit it before moving on.
5. Receive correctness, marks, explanation, and cited textbook page immediately.
6. Review any answered item from the progress rail or session history.
7. Report a questionable item before or after answering, with an optional comment.

## Current practice and grading

- An exercise targets ten questions when enough eligible content exists: seven objective/fuzzy-answer items and three subjective items.
- The selector prioritizes due or previously weak questions, then unseen questions, then reinforcement.
- Supported player types are single choice, multiple select, fill in the blank, true/false with correction, matching, one word, brief answer, multi-point answer, and compare/differentiate.
- Multiple-choice, multiple-select, and matching answers are deterministic.
- OpenRouter provides semantic fallback for fill-in-the-blank, one-word, and false-statement corrections when deterministic checking does not accept the answer.
- Brief, multi-point, and comparison answers are graded against weighted, source-grounded rubric points. Partial coverage receives partial marks; low-confidence grading is marked for parent attention.
- Every scored item cites one or more source pages. Full textbook pages are not displayed in the MVP.
- Children cannot skip. Retry and hints are deliberately absent from the current learning loop.

## Current progress and motivation

- Supabase stores sessions, attempts, marks, latest-question mastery, chapter coverage, and spaced-review state per child.
- The child dashboard shows questions answered, completed-session count, recent scores, resume links, and answer history.
- The parent sees each child's completed sessions, accuracy, mastery, due-review count, grading-review count, and recent session scores.
- There is no sibling comparison, leaderboard, streak, level, or parent notification.

## Content and traceability

- The versioned JSON contract stores chapter metadata, topics, source pages/regions, questions, answers, explanations, and scoring rubrics.
- Codex performs OCR/page understanding, bank generation, and grounding review outside the runtime application.
- Source manifests store filenames and hashes, not copyrighted textbook pages or local absolute paths.
- Imported bank versions become immutable after study history exists. Disabling a reported question creates a new version while preserving old attempts.
- Parent-authored corrections, exam-specific scope, and out-of-syllabus controls are not implemented yet.

## AI and cost

- The OpenRouter key and model are configured on the server, not by a parent in the UI.
- Question generation is front-loaded outside the app.
- Runtime AI is limited to subjective grading and fuzzy comparison where exact matching is unsafe.
- Objective scoring remains deterministic and free of model calls.

## Deferred

- Multi-family signup and super-admin family management
- In-app textbook/PDF upload, OCR, bank generation, and BYOK configuration
- Exam scope, out-of-syllabus exclusions, and sample-paper-driven exercises
- Voice answers and transcript correction
- Source-group and map-work interactions
- Native mobile apps and offline synchronization
- Open-ended tutoring, daily plans, parent notifications, and sibling competition

## Product principles

1. Source-grounded over encyclopedic.
2. Honest uncertainty over confident misgrading.
3. Independent progress without child comparison.
4. Feedback that explains missing thinking, not only correctness.
5. Reusable content with low runtime AI cost.
6. A small understandable product over feature accumulation.
