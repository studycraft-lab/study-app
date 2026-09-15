# Tutoring content storage

Apply the new migration to a separate preview Supabase project using the normal migration process. Never point a mutating preview at production. `TUTOR_ENABLED=true` enables the experimental parent page at `/parent/library/tutor`; the default is false. No migration has been applied to a hosted database by this implementation.

Parents choose an existing course/chapter and confirm the exact heading. The server compares board, grade, subject, chapter title and known book title, and obtains family identity from the authenticated workspace. Import never creates an exercise bank, topic or course. A separate `tutor_sections` catalogue records exact textbook headings and pages.

Each imported pack starts as a draft. Preview is required before explicit publication. Source-unverified examples cannot be published; original synthetic fixtures can be used to demonstrate portability. A source review claim remains the author's responsibility and must be checked by the parent. All versions, including drafts, are immutable: correct the external JSON and increment contentVersion. Archiving removes availability for new sessions; existing pinned sessions are allowed to finish against their original version. Publication archives the previous current version atomically without deleting it.

Server routes validate the JSON before calling service-role-only RPCs. Import uses a chapter lock and lesson-identity advisory transaction lock; publication locks the section before its pack. Unique constraints provide an additional backstop. Content hashes use sorted-key canonical JSON. RLS and revoked public/anon/authenticated permissions prevent direct browser data access. The existing single-family parent authentication model is preserved.

Local database tests execute the migration in PGlite against the repository's original content/family schemas. They verify rollback, immutable versions, chapter/family checks and anonymous privileges. PGlite uses one database connection; these tests do **not** demonstrate multi-connection production contention or hosted Supabase configuration. Route and UI tests mock their external boundaries. No voice calls occur.

## Player and progress

`/study/tutor?pack=<published-version-uuid>` starts/resumes that version; `?resume=<progress-uuid>` opens a saved session. The child request/library story supplies these links. The parent preview uses the identical player in local scripted mode without saving child rewards. Both render only validated vector primitives, respect reduced motion, and expose keyboard/touch controls. Rehearsal cannot answer open-ended questions and sends no microphone audio.

Progress is stored separately in `tutor_progress`, one record per child and immutable pack version. Commands carry an expected revision and bounded call ID; a shared state machine checks phase, step and target IDs. Replayed commands cannot add stars, and compare-and-swap SQL writes reject simultaneous stale saves. Stars are derived from unique completed checkpoint IDs, not client totals. Resume returns to the current teaching explanation or the earned checkpoint's ready boundary, with completed checks retained. A short prepared explanation recaps the step; no mid-audio replay or raw transcript is stored. Choice answers use the answer key; rehearsal text uses normalised prepared variants and is labelled formative. Live model assessment is not implemented by the rehearsal engine.

Apply `20260915020000_create_tutor_progress.sql` after the content migration. Local SQL tests demonstrate independent sibling progress, draft/archived start restrictions, pinned archive recovery, grade eligibility and stale-write rejection. They still do not demonstrate real parallel Supabase connections or live voice behavior.
