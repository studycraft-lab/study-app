# Plastids integrated pilot: handoff and evidence

**Not accepted; live flags remain off.** Epic #44 / story #50. Source-reviewed pack: [`v1.json`](../../lesson-packs/icse-6-biology/plastids/v1.json), with [review and source identity](../../lesson-packs/icse-6-biology/plastids/REVIEW.md). The source PDF is now accessible; the POC ZIP is still missing.

## Completed locally

- Actual scanned textbook p38/PDF5 reviewed; p37/PDF4 supports only the cytoplasm clarification.
- Four bounded teaching steps, original diagrams/animations, four checkpoints, spelling variants, prepared clarifications and a three-type recap.
- Shared contract validation and local SQL/state integration test. Synthetic shapes import uses the same pack contract and renderer without a code change.
- Auth, content, requests, private progress and voice controls have automated tests. Provider/media/controller events are mocked; database tests use local PGlite.

## Required environment / unresolved inputs

Provide the POC ZIP as a workspace path or accessible attachment. Configure preview-only Supabase and OpenAI secrets through the environment, not a message or committed file. Identify a supervised, continuously running controller host and the intended tablet/browser. See [voice setup](VOICE.md) for Vercel/Codespaces HTTPS and controller requirements. No hosted migration, authenticated deployed preview pilot, model entitlement check or real microphone session has been performed. GitHub reports successful Vercel preview checks for the first five PRs; this does not establish preview data configuration or live acceptance.

A running controller is essential for usage enforcement. Host/provider outages and unknown call creation outcomes remain operational limits; deployment evidence must resolve them before claiming a hard cap. The verification flag is not itself evidence. Parent acceptance is required before routine child use, as specified by #50.

## Reproducible supervised walkthrough

1. In the separate preview database, use an existing ICSE Grade 6 Biology / The Cell chapter (import its existing question bank through the normal parent flow if absent). Sign in as an eligible child and request **Plastids**, printed p38. Check another child cannot see this private request.
2. Parent opens the request queue, maps exact catalogue ID `plastids`, heading `Plastids`, and marks preparing. Use the [external authoring workflow](AUTHORING.md) with the source and schema; the reviewed v1 pack is ready for this preview.
3. Import `lesson-packs/icse-6-biology/plastids/v1.json` mapped to that chapter. Play the full parent rehearsal, check labels/animations/layout and publish. Mark the request ready with this published version. Confirm the child sees it ready and can launch; drafts must remain unavailable.
4. Rehearse first without provider credentials. Check understanding earns no star. Give a wrong answer, use the hint/retry, then answer correctly for exactly one star. Check “what does cytoplasm mean?” and resume after refresh.
5. After controller deployment verification, enable voice only in the supervised preview. Observe microphone disclosure and permission, first audio and matching board. Interrupt “explain chlorophyll again”; the current step must remain current. Try typed text, choices, repeat, mute and end.
6. Complete all four checks, recap, end, and reopen an interrupted saved session. Confirm mic tracks, audio and connections are released. Check another child has independent progress and no sibling comparison.
7. Import/preview/publish `examples/lesson-packs/synthetic-shapes.json` under its matching Demo / Grade 6 / Geometry / Synthetic shapes chapter. Use a matching test child for child playback. Do not relabel it as ICSE content. No renderer code change should be needed.
8. Observe denied mic, autoplay blocking, provider unavailability/quota, disconnect, browser abandonment, simultaneous starts, parent disable and actual expiry. Test controller restart while a known call is active and verify provider hangup from trusted evidence. Record uncertain outcomes explicitly.
9. Run normal parent/child login, question-bank import, chapter practice, deterministic and OpenRouter grading, answer history and exercise resume smoke checks in preview. Tutor progress must not affect exercise marks/mastery.

## Evidence record — fill only from observation

| Item | Current evidence |
| --- | --- |
| Preview URL / commit / migration state | PR preview checks succeeded; authenticated environment and migration state not verified |
| Device / OS / browser / microphone | Not tested |
| Controller host / supervisor / restart policy | Not configured |
| OpenAI account model access / voice | Not checked against an account |
| POC compatibility comparison | Blocked: ZIP unavailable |
| Authenticated request → publish → child launch | Local SQL/API tests; deployed flow not observed |
| First-audio delay / conversational pauses | Not measured |
| Interrupt-to-silence / animation stop / board coordination | Mocked events only; real timing not measured |
| Wrong-answer/retry, clarification, four stars, recap, resume | Deterministic pack/state/SQL tests; real speech not observed |
| Session duration / expired-call termination / abandoned tab | Independent timer/recovery mocks; hosted provider termination not observed |
| Concurrent starts / daily allowance | Local single-connection SQL tests; real concurrent connections pending |
| Provider usage / cost | No live usage; no cost estimate claimed |
| Existing exercise smoke tests | Automated regression suite; hosted smoke pending |
| Parent decision / date / remaining blockers | Pending |

Record timestamps and measurement method, distinguish estimates from measured values, and avoid storing audio, credentials or full transcripts in this record. Keep failure outcomes as well as successful trials. If a control cannot be verified, leave live mode off and document the blocker.
