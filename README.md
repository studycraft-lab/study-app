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
3. Copy `.env.example` to `.env.local` and use values from the Supabase project’s Connect panel.
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
2. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for Preview and Production.
3. Keep `main` as the production branch. Vercel creates previews for other branches and production deployments from `main`.

Neither Supabase value is exposed through a `NEXT_PUBLIC_` variable. The application performs the query on the server and returns only the safe health response.

## Product documents

- [Product brief](docs/PRODUCT.md)
- [Question-bank contract](docs/QUESTION_BANK.md)
- [Roadmap](docs/ROADMAP.md)
