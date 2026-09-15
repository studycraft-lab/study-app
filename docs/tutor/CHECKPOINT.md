# Live tutoring implementation checkpoint

Requested: epic #44, stories #45–#50; separate stacked PRs, no merge or production deployment.
Baseline: main f5544a2. Read all seven issue bodies and comments (none), AGENTS.md, README, CI, local Next.js route/client guides and existing auth/import patterns.

## Status

- #45: contract, types, semantic validation, fixtures and external authoring guide implemented; lint/typecheck pass; full suite 155 passed, 1 optional CLI test skipped; build passes outside sandbox (sandbox TypeScript child output failed). 17 targeted contract tests pass. PR https://github.com/studycraft-lab/study-app/pull/51 (base main).
- #46: atomic import/publication, chapter mapping, parent library and vector/script preview complete. Full suite: 176 passed, 1 optional CLI test skipped; 6 tests execute SQL in PGlite. Lint/typecheck/final build pass; PR https://github.com/studycraft-lab/study-app/pull/52 (base #51). Shared animated rehearsal follows in #48.
- #48: generic animated player, shared parent rehearsal, bounded command state machine, child progress/CAS and stable resume implemented. Full suite 189 passed, 1 optional CLI test skipped; lint/typecheck/build pass. SQL tested locally; voice not tested. PR https://github.com/studycraft-lab/study-app/pull/53, stack base #52.
- #47: child section library/requests, parent catalogue/queue and published-pack fulfilment implemented. Full suite 197 passed, 1 optional CLI skipped, followed by 11 passing focused auth tests (5 new). Lint/typecheck/final build pass. PR https://github.com/studycraft-lab/study-app/pull/54; stack base #53.
- #49: WebRTC adapter, authenticated setup, portable trusted controller, bounded tools/board acknowledgements, SQL allowances and parent controls implemented. Lint/typecheck/build pass; full suite 242 passed, 1 optional CLI skipped, followed by two parent authorization tests. Provider/browser/controller tests are mocked; reservation tests execute local PGlite SQL. No real voice or multi-connection Supabase test. Draft PR pending, base #54. See VOICE.md for hosting requirements and unresolved hard-cap limits.
- #50: PDF recovered through the Drive link in issue #50 on 2026-09-15. Visually inspected printed p38 / PDF p5 and cytoplasm clarification p37 / PDF p4. Source-reviewed pack and pilot handoff next; POC ZIP and integrated real pilot still missing.

## Missing inputs / verification boundaries

User supplied `[insert paths]`. No supplied local POC ZIP or textbook PDF found initially. PDF now accessible from issue #50 via Google Drive; temporary download only, SHA-256 e25dea1fb949b0107b918a6d96c8d0f4b8d0ffb5902ffd8c7923b0cbea20e269. Requested POC ZIP path remains unanswered. Do not commit scans. `plastids-unverified.json` is solely a contract fixture based on issue outline. No voice or device testing performed. Feature must remain off until pilot acceptance. Existing exercise behavior must stay unchanged.

Required per-story gates: npm run lint; npm run typecheck; npm test; npm run build. Record results and PR URLs here. Parent auth is currently single-family (`ensureFamily`); child auth carries family/board/grade from server lookup. Supabase tables are service-role only with RLS. Use append-only migrations and explicit family filters.

## Resume / merge order

PR #51 (#45) → #52 (#46) → #53 (#48) → #54 (#47) → #49 story branch → #50 story branch. Each PR compares against the previous branch; retarget/rebase in order after authorized merges. Do not merge or deploy to production. Current implementation is on `tutor/49-live-voice`. No hosted migrations applied. Preview Supabase/OpenAI credentials and an approved continuously running controller host are unavailable; never write their values here.
