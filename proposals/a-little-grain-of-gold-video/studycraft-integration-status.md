# StudyCraft integration — COMPLETE

Published 27 September 2026. The user explicitly approved existing Supabase server-key use for the final upload ("Yes yes pls").

## Final verification

- Uploaded the Runway revision-3 video, poster, and captions to private `tutor-videos/a-little-grain-of-gold-v2/`.
- Each uploaded file was downloaded through the authenticated Storage API and its SHA-256 checked against video-v2.json. All three matched.
- Live parent playback verified: 1920×1080, duration 611.166667 seconds, readyState 4, no media error, playback range 348.6–361.15805 seconds. Section navigation to Regret and back to Welcome worked.
- Published using the parent UI. The live library visibly shows Published and Hide from children.
- Video id `af666f5f-97b1-4e75-a7fa-51024939f382`.
- Parent preview: https://studycraft-iota.vercel.app/parent/library/tutor/video/af666f5f-97b1-4e75-a7fa-51024939f382
- Child lesson: https://studycraft-iota.vercel.app/study/tutor/video/af666f5f-97b1-4e75-a7fa-51024939f382
- Child route correctly requires child sign-in; the browser had only a parent session, so playback was verified in the shared parent player. No child PIN or account was changed.
- No secret was printed or stored in a credential file. The existing legacy service-role key was passed from the authorized dashboard control into a password field on a local loopback upload helper. It stayed in memory; the helper was stopped and removed, its tab closed, clipboard cleared, and in-memory key variables cleared. The dashboard tab was closed after returning away from credentials.
- Full video remains local at output/video/a-little-grain-of-gold-v3/a-little-grain-of-gold.mp4. Public GitHub contains app code, tests, and metadata only.
- PR 69 merged; production Vercel deployment successful. No more approvals are needed for this completed first cut.

## Later cut

Add pause-and-answer multiple-choice checkpoints below the video. Not implemented in the first cut.

---

The checkpoint below is historical and superseded by the completion notes above.

# StudyCraft integration checkpoint — 27 September 2026

## Current result

The user preferred the Runway sample and authorized publishing app code, tests, and lesson metadata to public `studycraft-lab/study-app` and deploying. Do not ask again for that approval. Do not publish the old Voice A video.

The full expressive Runway video is complete at `output/video/a-little-grain-of-gold-v3/a-little-grain-of-gold.mp4` (16 MB, 10:11, 1080p24, H264/AAC). It uses Niki, eleven_v3, model speed .9 for explanations and .82 for poem readings. All 27 generated clips were transcribed and aligned to the full approved script. All 182 beats, eight passages, 164 captions, and six five-second pauses are retained. Clip 33's final alignment was corrected using a cropped tail. Complete video/audio decode passed. Representative frames were checked. Companion captions, poster, chapters, script, README, and qa.json are in the same output folder.

Working files: `/private/tmp/grain-of-gold-production-v3`. Assembly script there reuses cached alignments. Production renderer/finalizer use `LESSON_WORK` and `LESSON_OUT`. Production scripts and media remain untracked; do not add them to public GitHub.

## Code and deployment

PR https://github.com/studycraft-lab/study-app/pull/69 is attached to this task and MERGED.
- Branch: `codex/poem-video-lesson`.
- Head before merge: `b8ec9bcbd683c3c8a6581cd7f47ffae74d1b0293`.
- Squash merge: `67745c6322e3939f792d092f18b1e63ffa929482`.
- CI run 36305426220: lint, typecheck, full tests, build SUCCESS.
- Vercel preview and production merge deployment SUCCESS. Production Vercel target: https://vercel.com/study-craft/studycraft/BwBxynPmdP315jRD8ryKqJN6Wohw.
- Live authenticated parent library verified: Video lessons panel shows A Little Grain of Gold, Draft, 10:11, correct preview route; existing Nucleus and Plastids lessons still present.
- Version-2 manifest: `lesson-packs/icse-6-english-literature/a-little-grain-of-gold/video-v2.json`.
- Canonical manifest hash: `d65f1666ea733816c56b138774e690877c81ad432f6a09a80b9f411d07fe5278`.
- Local importer `--check` verified all 3 media hashes.

Player includes private signed playback, parent preview/publish/hide, child chapter cards, video-only chapters without fake exercise banks, responsive native controls and section navigation. Second-cut question checkpoints are documented but not implemented yet.

## Production resources

Supabase project `llrgblwrywrauzfjledj`, course `b9826d8f-4d78-45a1-b541-502a53775906`, chapter `d29e5a45-845f-44d3-afe6-4ca3d95c3612`.
New Runway row `af666f5f-97b1-4e75-a7fa-51024939f382`, content_version 2, DRAFT, prefix `a-little-grain-of-gold-v2`.
Old task-created version-1 draft row was removed only after verifying its exact hash, draft status, and no media uploaded. Its metadata history remains in Git. Both empty storage folders remain; do not delete folders unnecessarily.
Private bucket `tutor-videos` has no public policies. V2 folder contains only `.emptyFolderPlaceholder`; all three real files still need upload.
Migration local `20260927070106_create_tutor_video_lessons.sql` was applied via MCP ledger `20260927071201`; do not push entire CLI migration history.

## Remaining upload blocker and pending user question

Chrome file chooser `setFiles` still fails with Not allowed after user enabled extension Allow access to file URLs. Do not keep retrying unchanged permission. Native Chrome inspection was auto-review blocked because its foreground window is unrelated private Google Drive. Do not inspect that window. Chrome extension internal settings URL was separately browser-policy blocked; do not bypass it.

Local `.env.local` contains placeholders, not production credentials. Supabase CLI is not logged in. Do not print credentials or attempt local upload with placeholders.

Existing authenticated Supabase UI exposes an existing default server secret key. Attempt to reveal/export it was blocked by automatic approval review because specific key-use authorization was missing. NO KEY WAS REVEALED OR EXPORTED. Do not retry until user explicitly approves. An asynchronous question is pending:
"The finished 10:11 Runway video is ready. May I use StudyCraft’s existing Supabase server key solely to upload the video, poster, and captions to its private lesson storage? I’ll keep the key out of chat and GitHub and remove the temporary local copy afterward."
Options: yes use existing key for upload / no keep local.

After approval, possible safe operator path: use CUA visible API Keys UI to reveal existing key, suppress AX output, export visible page content to a local file, then parse it into a restricted temp env file without printing the key. Use normal server upload command, not browser fetch or cookie extraction. Remove temporary exported key/env copies afterward. Do not create/rotate any key. Never place key in tool arguments, chat, GitHub, or shell history. If export cannot safely provide it, stop and request user-assisted upload without exposing credentials.

Prepared upload filenames are `/private/tmp/studycraft-video-upload-v2/lesson.mp4`, `poster.jpg`, `captions.en.vtt`. The operator importer uses original-named files in output/video/a-little-grain-of-gold-v3 and finds the existing registered row/prefix. Import draft, preview real production media, then publish row after successful playback.

## Browser handles (CUA)

After compaction call `await cua.rewriteDocumentation()`.
- `storageTab`: Chrome 2 tab 2129886941, private bucket at path `a-little-grain-of-gold-v2`, marked handoff.
- `studycraftParent`: Chrome 2 tab 2129886746, authenticated existing parent session, currently `/parent/library/tutor`.
- Original tab 2129886778 is gone. Do not interact with unrelated Drive tabs/windows.
- IAB user Runway sample remains open. Full V3 video queued via open_in_codex file panel.

After production deployment, parent preview route is `/parent/library/tutor/video/af666f5f-97b1-4e75-a7fa-51024939f382`; child route `/study/tutor/video/af666f5f-97b1-4e75-a7fa-51024939f382`.
Keep lesson DRAFT until media upload and playback verified. Do not claim live child playback while media is absent.

No local dev server is running. Untracked output/, proposals/, supabase/.temp/ are expected; new tmp/pdfs files appear to belong to concurrent user work, leave them alone.
