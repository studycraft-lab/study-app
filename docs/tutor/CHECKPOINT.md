# Live tutoring implementation checkpoint

Requested: epic #44, stories #45–#50; separate stacked PRs, no merge or production deployment.
Baseline: main f5544a2. Read all seven issue bodies and comments (none), AGENTS.md, README, CI, local Next.js route/client guides and existing auth/import patterns.

## Status

- #45: contract, types, semantic validation, fixtures and external authoring guide implemented; lint/typecheck pass; full suite 155 passed, 1 optional CLI test skipped; build passes outside sandbox (sandbox TypeScript child output failed). 17 targeted contract tests pass. PR https://github.com/studycraft-lab/study-app/pull/51 (base main).
- #46: atomic import/publication, chapter mapping, parent library and vector/script preview complete. Full suite: 176 passed, 1 optional CLI test skipped; 6 tests execute SQL in PGlite. Lint/typecheck/final build pass; PR pending. Shared animated rehearsal follows in #48.
- #48: next: player, deterministic state and per-child progress.
- #47: after import/library contracts.
- #49: after player/import; verify official Realtime docs, credentials/model availability and server termination architecture. Mock tests cannot establish live acceptance.
- #50: blocked on real sources and later integrated live pilot. Source-checked content is not implemented.

## Missing inputs / verification boundaries

User supplied `[insert paths]`. No POC ZIP or textbook PDF found under /workspaces or /tmp (depth 4). Requested actual paths. Do not invent sources or commit scans. `plastids-unverified.json` is solely a contract fixture based on issue outline. No voice or device testing performed. Feature must remain off until pilot acceptance. Existing exercise behavior must stay unchanged.

Required per-story gates: npm run lint; npm run typecheck; npm test; npm run build. Record results and PR URLs here. Parent auth is currently single-family (`ensureFamily`); child auth carries family/board/grade from server lookup. Supabase tables are service-role only with RLS. Use append-only migrations and explicit family filters.
