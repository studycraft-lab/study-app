# Tutoring content storage

Apply the new migration to a separate preview Supabase project using the normal migration process. Never point a mutating preview at production. `TUTOR_ENABLED=true` enables the experimental parent page at `/parent/library/tutor`; the default is false. No migration has been applied to a hosted database by this implementation.

Parents choose an existing course/chapter and confirm the exact heading. The server compares board, grade, subject, chapter title and known book title, and obtains family identity from the authenticated workspace. Import never creates an exercise bank, topic or course. A separate `tutor_sections` catalogue records exact textbook headings and pages.

Each imported pack starts as a draft. Preview is required before explicit publication. Source-unverified examples cannot be published; original synthetic fixtures can be used to demonstrate portability. A source review claim remains the author's responsibility and must be checked by the parent. All versions, including drafts, are immutable: correct the external JSON and increment contentVersion. Archiving removes availability for new sessions; existing pinned sessions are allowed to finish against their original version. Publication archives the previous current version atomically without deleting it.

Server routes validate the JSON before calling service-role-only RPCs. Import uses a chapter lock and lesson-identity advisory transaction lock; publication locks the section before its pack. Unique constraints provide an additional backstop. Content hashes use sorted-key canonical JSON. RLS and revoked public/anon/authenticated permissions prevent direct browser data access. The existing single-family parent authentication model is preserved.

Local database tests execute the migration in PGlite against the repository's original content/family schemas. They verify rollback, immutable versions, chapter/family checks and anonymous privileges. PGlite uses one database connection; these tests do **not** demonstrate multi-connection production contention or hosted Supabase configuration. Route and UI tests mock their external boundaries. No voice calls occur.
