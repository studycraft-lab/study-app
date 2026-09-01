# StudyCraft

StudyCraft is a family-first study application that turns textbook chapters into traceable, interactive practice. A shared question bank can serve multiple children while progress and review remain private to each learner.

The current foundation is a responsive Next.js PWA with a server-side Supabase health check. Study features will be added story by story.

## Stack

- Next.js App Router and TypeScript
- Supabase
- Vercel
- Vitest, Testing Library and GitHub Actions

## Local setup

Requirements: Node.js 20.9 or newer and a Supabase project.

1. Run [`supabase/migrations/20260901000000_create_app_config.sql`](supabase/migrations/20260901000000_create_app_config.sql) in the Supabase SQL editor.
2. Run [`supabase/seed.sql`](supabase/seed.sql) to create the harmless configuration value used by the health check.
3. Copy `.env.example` to `.env.local`. Set the Supabase URL and keys from the project’s Connect/API Keys panels, choose a long parent passphrase, and add the OpenRouter key used for subjective-answer grading.
4. Install and start the application:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page should show “StudyCraft is connected.” The JSON health seam is available at `/api/health`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The same commands run in GitHub Actions for pushes and pull requests.

## Vercel deployment

1. Import `studycraft-lab/study-app` into Vercel.
2. Configure these environment variables. Do not paste their values into the repository, logs, screenshots, or support messages.

| Variable | Required scope | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Production and Preview | Identifies the Supabase project. |
| `SUPABASE_PUBLISHABLE_KEY` | Production and Preview | Supports the server-side health/configuration check. It is not exposed through a `NEXT_PUBLIC_` variable. |
| `SUPABASE_SECRET_KEY` | Production | Allows trusted server routes to import banks and read/write family learning data. Never expose it to browser code. |
| `PARENT_IMPORT_PASSPHRASE` | Production | Protects parent sign-in and question-bank import; it also provides the default signing secret for parent and child sessions. |
| `OPENROUTER_API_KEY` | Production | Enables server-side grading of subjective answers. Never expose it to browser code. |

Preview deliberately receives only the URL and publishable key, so preview deployments can run connectivity checks without gaining permission to mutate production learning data. If a separate preview Supabase project is introduced later, give Preview its own secret key and passphrase rather than reusing Production credentials.

Optional application settings are `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_MS`, and `NEXT_PUBLIC_APP_URL`. Dedicated `PARENT_SESSION_SECRET` and `CHILD_SESSION_SECRET` values may also be configured; otherwise the application falls back to `PARENT_IMPORT_PASSPHRASE` for signing those sessions.

For the chapter-import CLI, set `STUDYCRAFT_PARENT_PASSPHRASE` only in the local shell. Its value must match the deployed `PARENT_IMPORT_PASSPHRASE`; the differently named variable prevents the server secret from being stored in the repository.

3. Keep `main` as the production branch. Vercel creates previews for other branches and production deployments from `main`.

All Supabase and OpenRouter credentials are consumed server-side. The application returns only safe results to the browser.

## Product documents

- [Product brief](docs/PRODUCT.md)
- [Question-bank contract](docs/QUESTION_BANK.md)
- [Roadmap](docs/ROADMAP.md)
