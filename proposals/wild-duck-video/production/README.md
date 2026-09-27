# Wild Duck video source

`plan-and-script.md` in the parent folder is the approved content source for this production. `build.py` turns its ten scenes into offline Kokoro speech, captions and a timed scene list. `render.cjs` draws original vector frames. FFmpeg combines those frames and the narration into the MP4.

This source is provided to preserve the production method; the finished files are in `output/video/wild-duck/`. The scan and Kokoro model weights are user/local inputs and are not committed.

## Requirements

- Python with `numpy`, `onnxruntime`, `soundfile` and `kokoro-onnx`
- Kokoro v1.0 ONNX model and voices binary
- Node.js with `@napi-rs/canvas`
- Georgia and Arial TrueType fonts
- FFmpeg

Set `KOKORO_MODEL_DIR` to the folder containing `kokoro-v1.0.onnx` and `voices-v1.0.bin`. Set `CANVAS_MODULE` to the installed `@napi-rs/canvas` module path if it is not found by Node. Set `LESSON_FONT_DIR` if the fonts are elsewhere. `LESSON_WORK` and `LESSON_OUT` can override the temporary work and finished output folders.

Run `build.py audio`, then `node render.cjs`. The final FFmpeg pass uses the generated `frames.ffconcat` and `narration-raw.wav`:

```sh
ffmpeg -f concat -safe 0 -i "$LESSON_WORK/frames.ffconcat" \
  -i "$LESSON_WORK/narration-raw.wav" -vf fps=24 \
  -c:v libx264 -crf 21 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart -shortest \
  "$LESSON_OUT/wild-duck.mp4"
```

The narration was generated with the offline `af_heart` voice. The code does not require a question bank or a paid API.
