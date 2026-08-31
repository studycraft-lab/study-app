# Product brief

## Product outcome

Help children revise textbook chapters deeply through short, motivating practice sessions. Parents upload content once; each child receives independent progress, mistake review, and mastery tracking.

## First users

- One family: parent profiles and three independent child profiles.
- Grade and board are profile/content attributes, not hard-coded application behavior.
- English-medium subjects first, beginning with History/Geography-style content.

## Core journey

1. Parent creates a subject and chapter and associates textbook pages, PDFs, notes, or worksheets.
2. A versioned question bank is generated outside the application with Codex and imported.
3. Child signs in with a simple profile/PIN.
4. Child chooses **Continue studying**, **Choose a chapter**, or **Review mistakes**.
5. The app asks one question at a time and gives feedback after submission.
6. Mistakes return through spaced repetition; progress remains private to that child.

## MVP

### Content and traceability

- Subjects, chapters, source pages, page numbers, and optional image regions.
- Every scored question, answer, hint, explanation, and rubric is grounded in one or more uploaded pages.
- Low-confidence extraction is flagged; unsupported facts are not silently introduced.
- Parent can edit, disable, or flag a generated question; child can flag it for parent review.
- Parent can exclude a chapter, topic, page/region, or question from general or exam-specific scope without deleting it.

### Practice

- Multiple choice, multiple select, fill-in-the-blank, true/false with correction, matching, one-word, brief answer, multi-point answer, compare/differentiate, and source-based question groups.
- Objective answers are scored deterministically.
- Subjective answers receive marks, a simple verdict, covered/missing rubric points, and actionable feedback.
- One initial attempt; after an error the child may retry unaided, request a stored hint, or see the explanation.
- Skipped questions return near the end of the session.
- Default session is about 20 minutes, finishes the current question, then offers continuation.
- App manages difficulty. Correct answers can expose an optional **Know more** item.

### Learners and progress

- Shared content and question banks; separate child attempts, mastery, and review schedules.
- Track chapter coverage, factual accuracy, and topic mastery.
- Personal points, stars, streaks, and levels; no sibling comparison or leaderboard.
- Parent dashboard shows progress by child and subject. No notifications initially.

### Devices and delivery

- Hosted responsive web application optimized for tablets and computers.
- Installable PWA is optional convenience; the normal URL always works.
- Online-only first release.

### AI and cost

- Family-level bring-your-own API configuration.
- Front-load extraction, question generation, hints, explanations, rubrics, and validation.
- Use runtime AI only for subjective grading and genuinely dynamic explanations.
- Keep provider integration replaceable; never expose API credentials in browser code.

## Exam-ready exercises

An exam scope selects chapters and excludes out-of-syllabus topics/pages. A paper pattern may be entered manually or derived from an uploaded sample paper. Generated exercises draw facts only from the selected textbook content while following the requested sections, question types, marks, choice rules, and answer lengths.

## Deferred until the core loop works

- Automated in-app OCR and question generation.
- Native iOS/Android applications.
- Public family signup, subscriptions, and central AI billing.
- Daily-plan generation and parent notifications.
- Competition between learners.
- Full offline synchronization.
- Open-ended tutoring and English-literature-specific grading.

## Product principles

1. Source-grounded over encyclopedic.
2. Honest uncertainty over confident misgrading.
3. Independent progress without child comparison.
4. Feedback that explains missing thinking, not only correctness.
5. Reusable content with low runtime AI cost.

