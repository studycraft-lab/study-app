# Repository maintenance notes

This file records intentionally retained items that can otherwise look obsolete during cleanup.

## Runtime boundaries

- Browser code calls only same-origin `/api/*` route handlers. Supabase and OpenRouter credentials remain server-only.
- Parent routes accept the signed parent-session cookie; protected import routes also support the local ingestion CLI's passphrase header.
- Child routes resolve a signed child-session cookie. The former parent-unlocked child-preview flow has been removed.
- Review scheduling remains active through `review_items`, `questionSelectionHistory`, attempt upserts, progress counts, and session-purge rebuilding. The unused standalone `/api/study/review` endpoint was removed.

## Intentionally retained

- All files in `supabase/migrations` are append-only deployment history, including definitions superseded by later migrations.
- `source_group` and `map_work` remain valid question-bank contract types for future players, but the current player does not select them.
- Question-bank `hint` data is accepted for forward compatibility, although the current UI does not show hints.
- CSS status suffixes such as `is-ok`, `is-degraded`, `is-disabled`, and `is-dismissed` are generated from typed runtime states rather than repeated as static JSX strings.
- Sample manifests, banks, and review records are regression fixtures and content examples. Copyrighted source-page images are deliberately excluded.
- `server-only` imports are deliberate safeguards against accidental client bundling.

## Safe-removal rule

Before deleting a route, export, selector, script, or dependency, confirm both static usage and runtime entry points. Applied migrations are never cleanup targets. Run the full verification suite and chapter gates after maintenance changes.
