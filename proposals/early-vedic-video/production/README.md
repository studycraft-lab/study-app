# Offline production

`lesson.json` is the editable source for narration and diagrams. The five screenshot filenames and checksums are recorded in `../source-manifest.json`; the screenshots themselves are not copied into this repository.

Requirements: Python with `numpy`, `soundfile`, `onnxruntime` and `kokoro-onnx`; Kokoro v1.0 model and voices; Node.js with `@napi-rs/canvas`; Arial and Georgia fonts; FFmpeg.

Set `KOKORO_MODEL_DIR` to the directory containing `kokoro-v1.0.onnx` and `voices-v1.0.bin`, `CANVAS_MODULE` to the installed canvas module if necessary, and optionally `LESSON_WORK` and `LESSON_OUT`. From the repository root:

```sh
python proposals/early-vedic-video/production/build.py
node proposals/early-vedic-video/production/render.cjs
ffmpeg -f concat -safe 0 -i "${LESSON_WORK:-/private/tmp/early-vedic-production}/frames.ffconcat" \
  -i "${LESSON_WORK:-/private/tmp/early-vedic-production}/narration.wav" -vf fps=24 \
  -c:v libx264 -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart -shortest \
  "${LESSON_OUT:-output/video/early-vedic-civilization}/early-vedic-civilization.mp4"
```

Default paths for the work and output directories are in the scripts. Narration uses the same offline Kokoro `af_heart` voice as the recent literature videos.
