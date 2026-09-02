# StudyCraft

StudyCraft is a family-first study application that turns source-grounded textbook question banks into private practice for each child. It is currently a single-family MVP hosted as a Next.js web application.

## What works today

- A parent signs in with the family password, creates child profiles, and assigns each child a board and grade.
- The parent imports a validated, versioned question-bank JSON generated outside the app with the repository's chapter-ingestion skill.
- Children sign in independently with their name and PIN, then see only chapters matching their board and grade.
- A normal exercise contains ten questions when the bank has enough material: seven objective/fuzzy-answer questions and three subjective questions.
- Answers are submitted one at a time. Deterministic questions are scored locally; OpenRouter handles rubric-based answers and fuzzy fallback for fill-in-the-blank, one-word, and false-statement corrections.
- Sessions, answers, marks, chapter coverage, stars, and spaced-review state are stored in Supabase. Unfinished sessions can be resumed and completed sessions can be reviewed.
- Children may report a questionable item with an optional comment. Parents can dismiss the report or disable the question in a new bank version.
- Parents can inspect concise progress and permanently purge an invalid session.

There is no public signup, multi-family administrator, in-app OCR/question generation, voice input, exam composer, skipping, retry, or hint flow yet. See [the roadmap](docs/ROADMAP.md).

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Supabase Postgres, accessed only from server route handlers
- OpenRouter for server-side fuzzy and subjective grading
- Vercel hosting
- Vitest, Testing Library, ESLint, TypeScript, and GitHub Actions

## Local setup

Requirements: Node.js 20.9 or newer, npm, and a Supabase project.

1. Apply every SQL file in [`supabase/migrations`](supabase/migrations) in filename order. Migrations are append-only; do not edit an already-applied migration.
2. Run [`supabase/seed.sql`](supabase/seed.sql).
3. Copy `.env.example` to `.env.local` and replace the placeholders.
4. Install dependencies and start the app:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `/api/health` should return a healthy StudyCraft response.

The first parent uses `PARENT_IMPORT_PASSPHRASE` as the family password. After parent sign-in, create children under **Children & progress**. Children then sign in separately with the saved name and PIN; a parent session is not required on their device.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Yes | Read-only health/configuration check. |
| `SUPABASE_SECRET_KEY` | Yes for the app | Server-only family, content, and learning-data access. |
| `PARENT_IMPORT_PASSPHRASE` | Yes | Parent sign-in, protected bank import, and default session-signing secret. |
| `OPENROUTER_API_KEY` | Yes for fuzzy/subjective grading | Server-only OpenRouter credential. |
| `OPENROUTER_MODEL` | No | Defaults to `deepseek/deepseek-v4-flash`. |
| `OPENROUTER_TIMEOUT_MS` | No | Defaults to 15000 ms. |
| `NEXT_PUBLIC_APP_URL` | No | OpenRouter HTTP referrer; public by design. |
| `PARENT_SESSION_SECRET` | No | Dedicated parent-cookie signing secret. |
| `CHILD_SESSION_SECRET` | No | Dedicated child-cookie signing secret. |

Never expose the Supabase secret key, OpenRouter key, password, or signing secrets through `NEXT_PUBLIC_` variables.

## Preparing and importing chapters

Do not commit textbook page images. In a Codex task rooted in this repository, attach the chapter and invoke `$chapter-ingestion`. The process creates a source manifest, question bank, and grounding-review record without storing machine-specific paths.

Validate the artifacts:

```bash
npm run chapter:manifest -- path/to/chapter-manifest.json
npm run chapter:sources -- path/to/chapter-manifest.json --source-dir /local/source/directory
npm run chapter:validate -- path/to/question-bank.json
npm run chapter:review -- path/to/question-bank.json
```

Import either through the parent Content screen or through the same authenticated API:

```bash
STUDYCRAFT_PARENT_PASSPHRASE='…' npm run chapter:import -- path/to/question-bank.json
```

See [the question-bank contract](docs/QUESTION_BANK.md) for versioning, grounding, and source-image rules.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs the same checks on `main` and pull requests. For a production smoke check, verify parent and child login boundaries, chapter launch, answer submission, session resume/completion, history, and question reporting.

## Deployment

Vercel deploys `main` to production. Configure all required variables above for Production. Preview should use a separate Supabase project; otherwise give Preview only the URL and publishable key so it cannot mutate production data.

The repository contains source manifests and generated question banks, but no textbook page images, local environment files, or credentials.

## Repository map

- `src/app`: pages and server route handlers
- `src/components`: parent and child UI flows
- `src/lib`: authentication, question-bank, grading, study, and Supabase services
- `supabase/migrations`: append-only database history
- `schemas`: canonical ingestion JSON schemas
- `samples`: manifests, banks, and grounding reviews
- `.agents/skills/chapter-ingestion`: reusable Codex ingestion workflow
- `docs`: product, roadmap, and question-bank documentation

## Product documents

- [Current product brief](docs/PRODUCT.md)
- [Question-bank contract](docs/QUESTION_BANK.md)
- [Roadmap and explicit deferrals](docs/ROADMAP.md)
- [Maintenance and intentional-retention notes](docs/MAINTENANCE.md)
