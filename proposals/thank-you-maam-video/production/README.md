# Thank You, Ma’am video source

`plan-and-script.md` in the parent folder is the content source for this production. `build.py` turns its ten scenes into offline Kokoro speech, captions, and a timed scene list. `render.cjs` draws original vector frames. FFmpeg combines those frames and the narration into the MP4.

Finished files are in `output/video/thank-you-maam/`. The user-supplied scan and Kokoro model weights are local inputs and are not committed.

## Requirements

- Python with `numpy`, `onnxruntime`, `soundfile`, and `kokoro-onnx`
- Kokoro v1.0 ONNX model and voices binary
- Node.js with `@napi-rs/canvas`
- Georgia and Arial TrueType fonts
- FFmpeg

Set `KOKORO_MODEL_DIR` to the folder containing `kokoro-v1.0.onnx` and `voices-v1.0.bin`. Set `CANVAS_MODULE` to the installed `@napi-rs/canvas` module path if Node does not find it. Set `LESSON_FONT_DIR` if the fonts are elsewhere. `LESSON_WORK` and `LESSON_OUT` override the temporary work and finished output folders. Run `build.py audio`, then `node render.cjs`, then encode the generated `frames.ffconcat` with `narration-raw.wav` at 24 fps using H.264 and AAC.

The narration uses the offline `af_heart` voice. The production does not require a question bank or paid API.
