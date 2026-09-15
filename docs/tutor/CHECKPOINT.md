# Live tutoring implementation checkpoint

Requested: epic #44, stories #45–#50. The user subsequently authorized merging the entire stack and delegated code-review decisions. All six PRs are now merged into main; normal Vercel deployment follows. Live activation remains pending configuration and real-session verification.
Baseline: main f5544a2. Read all seven issue bodies and comments (none), AGENTS.md, README, CI, local Next.js route/client guides and existing auth/import patterns.

## Status

- #45: contract, types, semantic validation, fixtures and external authoring guide implemented; lint/typecheck pass; full suite 155 passed, 1 optional CLI test skipped; build passes outside sandbox (sandbox TypeScript child output failed). 17 targeted contract tests pass. PR https://github.com/studycraft-lab/study-app/pull/51 (base main).
- #46: atomic import/publication, chapter mapping, parent library and vector/script preview complete. Full suite: 176 passed, 1 optional CLI test skipped; 6 tests execute SQL in PGlite. Lint/typecheck/final build pass; PR https://github.com/studycraft-lab/study-app/pull/52 (base #51). Shared animated rehearsal follows in #48.
- #48: generic animated player, shared parent rehearsal, bounded command state machine, child progress/CAS and stable resume implemented. Full suite 189 passed, 1 optional CLI test skipped; lint/typecheck/build pass. SQL tested locally; voice not tested. PR https://github.com/studycraft-lab/study-app/pull/53, stack base #52.
- #47: child section library/requests, parent catalogue/queue and published-pack fulfilment implemented. Full suite 197 passed, 1 optional CLI skipped, followed by 11 passing focused auth tests (5 new). Lint/typecheck/final build pass. PR https://github.com/studycraft-lab/study-app/pull/54; stack base #53.
- #49: WebRTC adapter, authenticated setup, portable trusted controller, bounded tools/board acknowledgements, SQL allowances and parent controls implemented. Lint/typecheck/build pass; full suite 242 passed, 1 optional CLI skipped, followed by two parent authorization tests. Provider/browser/controller tests are mocked; reservation tests execute local PGlite SQL. No real voice or multi-connection Supabase test. Merged PR https://github.com/studycraft-lab/study-app/pull/61. See VOICE.md for hosting requirements and unresolved hard-cap limits.
- #50: PDF recovered through the Drive link in issue #50 on 2026-09-15. Visually inspected printed p38 / PDF p5 and cytoplasm clarification p37 / PDF p4. Source-reviewed four-step pack and source review in `lesson-packs/icse-6-biology/plastids`; integrated local SQL rehearsal tests pass (2 tests). README/product/roadmap and `PILOT.md` handoff updated. Lint/typecheck/build pass. Full suite: 246 passed, 1 optional CLI skipped; additional four-step player UI test passes. Merged PR https://github.com/studycraft-lab/study-app/pull/62. POC ZIP and integrated real pilot still missing.

## Missing inputs / verification boundaries

User supplied `[insert paths]`. No supplied local POC ZIP or textbook PDF found initially. PDF now accessible from issue #50 via Google Drive; temporary download only, SHA-256 e25dea1fb949b0107b918a6d96c8d0f4b8d0ffb5902ffd8c7923b0cbea20e269. Requested POC ZIP path remains unanswered. Do not commit scans. `plastids-unverified.json` is solely a contract fixture based on issue outline. No voice or device testing performed. Feature must remain off until pilot acceptance. Existing exercise behavior must stay unchanged.

Required per-story gates: npm run lint; npm run typecheck; npm test; npm run build. Record results and PR URLs here. Parent auth is currently single-family (`ensureFamily`); child auth carries family/board/grade from server lookup. Supabase tables are service-role only with RLS. Use append-only migrations and explicit family filters.

## Merge result / resume

Merged in dependency order: #51 (#45) → #52 (#46) → #53 (#48) → #54 (#47) → #61 (#49) → #62 (#50). Every PR had passing CI and Vercel preview checks. Merge commits preserved branch ancestry. Main at `d429045` was verified byte-for-byte identical to the tested stack head `77f939e` before this documentation update. The local checkout is now main.

No hosted migrations or environment settings have been changed by Codex. No connected Vercel/Supabase management tools are available. Apply the four `20260915*.sql` migrations before enabling tutoring. Set `TUTOR_ENABLED=true` for rehearsal; keep `TUTOR_LIVE_ENABLED=false` until controller hosting, credentials and real termination/session checks pass. Environment changes require a new Vercel deployment. See [activation steps](VOICE.md#activation-after-merge).

Next session: provision/verify the target database and server-only credentials; identify and configure one supervised controller host; obtain the POC ZIP for comparison; then execute `PILOT.md` on the intended tablet/browser and record actual provider termination/usage. #49/#50 acceptance and the epic remain incomplete despite the authorized code merges. Do not repeat completed authoring or substitute mock results for live acceptance.

## Activation access audit and controller packaging

The user asked Codex to drive activation end to end. GitHub merge/deployment access works, but its integration returns HTTP 403 for Actions secret inspection. No Vercel/Supabase/OpenAI credentials or local login configuration were present; no secret values were printed. Direct Vercel and Supabase integrations were discovered and suggested for connection. Account connection is pending; do not hand SQL/configuration work back to the user once connected.

A deployable controller image is now in `deploy/tutor-controller.Dockerfile`, with an allowlisted build context and a non-root runtime. AJV dependencies moved from development to production because the standalone controller imports validation code. Docker build and an isolated, read-only/network-disabled container smoke test passed: unauthenticated/wrong-token health requests return 401, authenticated unconfigured readiness returns 503, and SIGTERM exits 0. Lint/typecheck and 47 focused tests pass. These are local deployment checks, not real voice/provider evidence. No hosted service was provisioned or billed. The continuously running host remains to be selected/configured after account access and any necessary paid-host authorization.
