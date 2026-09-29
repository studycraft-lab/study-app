# History revision video production

The editable narration and diagram content is in each chapter's `lesson.json`. The textbook screenshots remain outside this repository; source manifests record their hashes. The renderer makes original diagrams and uses the same offline Kokoro `af_heart` voice as the approved Early Vedic video.

For `later-vedic-civilization` or `egyptian-civilization`, from the repository root:

```sh
/private/tmp/grain-of-gold-neural/venv/bin/python proposals/history-video-production/build.py SLUG
CANVAS_MODULE=/private/tmp/studycraft-video-tools/node_modules/@napi-rs/canvas node proposals/history-video-production/render.cjs SLUG
ffmpeg -f concat -safe 0 -i /private/tmp/SLUG-production/frames.ffconcat -i /private/tmp/SLUG-production/narration.wav -vf fps=24 -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart -shortest output/video/SLUG/SLUG.mp4
ffmpeg -i output/video/SLUG/poster.png -frames:v 1 -q:v 3 output/video/SLUG/poster.jpg
python3 proposals/history-video-production/package.py SLUG
```

The paths above are examples for this workstation. Set `KOKORO_MODEL_DIR`, `LESSON_WORK`, `CANVAS_MODULE` and `LESSON_FONT_DIR` as needed. Packaging checks that the video is H.264/AAC and under 10 minutes, records hashes, and writes the StudyCraft import manifest.
