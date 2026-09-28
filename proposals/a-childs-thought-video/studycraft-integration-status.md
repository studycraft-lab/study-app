# A Child’s Thought — video integration

Production and upload complete. Final live playback/publishing awaits the existing parent session being refreshed through the normal StudyCraft sign-in form.

- User approved full video with the same catchy Runway voice.
- Full video: output/video/a-childs-thought/a-childs-thought.mp4, 534.833 seconds, 1920×1080, 24 fps, H.264/AAC, 14.7 MB.
- Same Runway Niki voice, eleven_v3, speeds .82 poem/.9 explanation, 23 clips.
- 20 exact source lines, 6 readings, 11 sections, 6 five-second thinking pauses, 142 caption cues. Original animated storybook art.
- Source scan: Scan_20260925_174441.pdf, PDF 5–6, printed 9–10. Source SHA c5f3f6d06a1dd0206ab4a7d2aed76afd85889a2db6e40dffc2c42a65b4bd4ace.
- Full decode, source match, caption continuity and manifest hash checks passed. Independent ASR checked all audio; no missing passages, all poem words matched. Representative 33 frames rendered and layout inspected. No manual listening claimed.
- Existing chapter 72c023a0-10a8-42ef-a356-cb6bfed85171, course b9826d8f-4d78-45a1-b541-502a53775906.
- Lesson 5b8110c3-2995-4862-8567-aac58135396b, status draft, prefix a-childs-thought-v1 in private tutor-videos bucket.
- Manifest hash f43cb6801d8d821415fd388e800ddba9a33d19ebd29337039bc0c512e7148815.
- Video, poster and captions uploaded and independently downloaded to verify SHA-256. In-memory helper stopped/deleted; key variables and clipboard cleared. No key was stored or logged.
- Public metadata only: PR https://github.com/studycraft-lab/study-app/pull/70 merged as 20632a6fbf8468fba945d68db1a5064b52ece894. CI and Vercel preview passed. No app-code/schema changes. Media/source/production files not published to GitHub.
- Parent preview https://studycraft-iota.vercel.app/parent/library/tutor/video/5b8110c3-2995-4862-8567-aac58135396b
- Child lesson https://studycraft-iota.vercel.app/study/tutor/video/5b8110c3-2995-4862-8567-aac58135396b

## Remaining action

Parent preview returned Parent sign-in required. Normal UI now open on /login > Parent, family password blank. Existing saved-password affordance did not autofill. Asked user asynchronously to sign in, then finish live video playback and publish using parent lesson library. Do not guess passwords, reset accounts, change authentication, or claim published until verified. Chrome studycraftParent tab 2129886746. Other upload/admin tabs closed.

Upload helper issue was Referrer-Policy: no-referrer producing Origin: null on form POST. Corrected to same-origin while retaining strict Origin and CSRF validation. Successfully uploaded using the exact same approved memory-only credential handling as the first poem.

Local git remains on codex/poem-video-lesson with new lesson manifest and production/output untracked. Remote metadata branch codex/childs-thought-video was created through GitHub connector. SSH fetch failed due unavailable signing agent; no local git history was altered.
