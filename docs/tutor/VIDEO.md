# Prepared video lessons

Video lessons live alongside the existing Plastids-style tutoring lessons. A child opens **Study → subject → chapter → Watch**. A chapter with a published video appears even before a question bank exists; it never offers a zero-question exercise. Parents can preview and hide or republish videos under **Content → Tutoring lessons → Video lessons**.

The first cut uses native video controls, visible poem highlights and captions, an optional English caption track, and timed section navigation. It does not store watch progress or award marks/stars. Existing interactive lessons and exercise history retain their own behavior. `TUTOR_ENABLED=true` enables both lesson formats; video playback does not require the live-voice feature or a voice-provider call.

## Storage and eligibility

`tutor_video_lessons` belongs to a chapter. Server routes resolve that chapter through the authenticated family's courses and, for children, check board, grade and published status. The table has RLS enabled and only `service_role` access. The `tutor-videos` bucket is private, with no public read policy. The server signs only the three stored asset paths for two hours; media bytes stream directly from Storage, avoiding the app server's response-size limit. Responses containing signed URLs are not cached. Hiding a lesson prevents new links; already issued links can remain valid until expiry.

The player handles expired or unavailable media with a reload action. Reloading rechecks eligibility and requests fresh URLs; it starts playback from the beginning. Watch-position persistence and cross-device resume are not part of this cut.

## Importing reviewed content

The operator command accepts a reviewed manifest, a directory containing its MP4/JPEG/WebVTT files, and an existing course ID. It checks all three SHA-256 digests before uploading. It requires server-side Supabase credentials through an environment file; never place them in a command argument or a manifest.

```sh
node --env-file=.env.local --import tsx scripts/import-video-lesson.mts \
  lesson-packs/icse-6-english-literature/a-little-grain-of-gold/video-v2.json \
  /path/to/approved/media COURSE_ID
```

Imports default to draft. Preview the video and publish it from the parent library. `--publish` is available for an operator importing already approved content. The manifest hash identifies an immutable version: changed content requires a higher `contentVersion`. Media is not committed to Git. A bucket can also be created and files uploaded through the authenticated Supabase dashboard when local credentials are unavailable; registration must use the same manifest and fixed filenames `lesson.mp4`, `poster.jpg`, `captions.en.vtt`.

## A Little Grain of Gold, version 2

The current manifest records the source PDF identity and revision-3 media digests. The lesson is 10:11 and uses the expressive American Runway delivery selected by the user. The full soundtrack was regenerated, with phrase highlights and captions aligned to the recorded speech. It reads all eight poem passages, preserves six five-second thinking pauses, and includes explanatory illustrations and 13 timed sections. Version 1 records the earlier Voice A draft and was not published. The source scan and video production working files remain local.

The local migration is `20260927070106_create_tutor_video_lessons.sql`; the production MCP ledger assigned `20260927071201`. As with the older tutoring migrations, reconcile ledger versions before a future CLI push; do not replay the entire migration history.

Validation: lint, TypeScript, production build, and the full CI test suite passed (one optional CLI test skipped). On local Node 26, tests require `NODE_OPTIONS=--no-experimental-webstorage`; CI uses Node 22. Browser verification of the earlier media in the shared player confirmed playback, seeking to 6:22, and a 390px layout with no horizontal overflow. The Runway replacement was checked separately for complete decoding, script coverage, timed captions, and representative rendered frames. This used a temporary local fixture, not a production child login. The temporary fixture is removed before deployment.

## Second cut: questions during playback

Add reviewed, timestamped multiple-choice checkpoints to the lesson's versioned content. At each checkpoint, pause the video and show the question and choices below it. Give feedback and an opportunity to retry; resume once the correct option is selected. Keep the child on the same video page.

That cut must also define seeking across an unanswered checkpoint, replay behavior, refresh/resume, and private per-child checkpoint progress. Validate answers on the server, preserve ordinary exercise scores, and provide an accessible focus/announcement transition from video to question. The first cut contains only the video's existing spoken thinking pauses; it does not yet enforce these interactive checkpoints.
