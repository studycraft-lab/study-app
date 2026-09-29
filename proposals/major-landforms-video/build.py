"""Produce detailed Geography narration, questions, captions and chapter timings."""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[2]
RATE = 24000
VOICE = "af_heart"


def stamp(seconds: float, decimal: str = ",") -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3600000)
    minutes, milliseconds = divmod(milliseconds, 60000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}{decimal}{milliseconds:03}"


def main() -> None:
    slug = sys.argv[1]
    lesson = json.loads((ROOT / f"proposals/{slug}-video/lesson.json").read_text())
    scenes = lesson["scenes"]
    if len(scenes) != 10 or any(len(scene["beats"]) != 3 for scene in scenes):
        raise ValueError("Expected ten scenes, each with three narration beats.")
    work = Path(os.environ.get("LESSON_WORK", f"/private/tmp/{slug}-production"))
    out = ROOT / "output/video" / slug
    model = Path(os.environ.get("KOKORO_MODEL_DIR", "/private/tmp/grain-of-gold-neural/models"))
    work.mkdir(parents=True, exist_ok=True)
    out.mkdir(parents=True, exist_ok=True)
    cache = work / "audio-cache"
    cache.mkdir(exist_ok=True)

    settings = ort.SessionOptions()
    settings.intra_op_num_threads = 4
    session = ort.InferenceSession(str(model / "kokoro-v1.0.onnx"), sess_options=settings, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(model / "voices-v1.0.bin"))
    audio_parts: list[np.ndarray] = []
    events: list[dict] = []
    cues: list[dict] = []
    clock = 0.0

    def silence(duration: float, scene: int, kind: str, beat: int = -1, count: int = 0) -> None:
        nonlocal clock
        audio = np.zeros(round(duration * RATE), dtype=np.float32)
        audio_parts.append(audio)
        events.append({"scene": scene, "beat": beat, "kind": kind, "count": count, "text": "", "start": clock, "end": clock + len(audio) / RATE})
        clock = events[-1]["end"]

    def speech(content: str, scene: int, beat: int, kind: str) -> None:
        nonlocal clock
        for sentence in re.split(r"(?<=[.!?])\s+(?=[A-Z])", content):
            key = hashlib.sha256(f"{VOICE}|0.99|{sentence}".encode()).hexdigest()
            file = cache / f"{key}.wav"
            if file.exists():
                audio, rate = sf.read(file, dtype="float32")
            else:
                audio, rate = engine.create(sentence, voice=VOICE, speed=0.99, lang="en-us", sentence_pause=0.0, clause_pause=0.05)
                audio = np.asarray(audio, dtype=np.float32).reshape(-1)
                sf.write(file, audio, rate)
            if rate != RATE or len(audio) < RATE // 5:
                raise ValueError(f"Bad narration: {sentence}")
            event = {"scene": scene, "beat": beat, "kind": kind, "text": sentence, "start": clock, "end": clock + len(audio) / RATE}
            audio_parts.append(audio)
            events.append(event)
            cues.append(event)
            clock = event["end"]
            silence(0.23, scene, "gap", beat)

    for scene_index, scene in enumerate(scenes):
        for beat_index, beat in enumerate(scene["beats"]):
            speech(beat, scene_index, beat_index, "say")
            silence(0.52, scene_index, "gap", beat_index)
        if scene.get("question"):
            speech(scene["question"], scene_index, -1, "ask")
            for remaining in range(8, 0, -1):
                silence(1.0, scene_index, "think", -1, remaining)
            speech(scene["answer"], scene_index, -1, "reveal")
        silence(0.75, scene_index, "gap")

    sf.write(work / "narration.wav", np.concatenate(audio_parts), RATE, subtype="PCM_24")
    timeline = {**lesson, "slug": slug, "voice": "Kokoro af_heart (offline)", "duration": clock, "events": events}
    (work / "timeline.json").write_text(json.dumps(timeline, indent=2, ensure_ascii=False))
    (out / "tutor-script.json").write_text(json.dumps(lesson, indent=2, ensure_ascii=False) + "\n")
    (out / "chapters.txt").write_text("\n".join(f"{int(next(e['start'] for e in events if e['scene'] == i) // 60):02}:{int(next(e['start'] for e in events if e['scene'] == i) % 60):02}  {scene['title']}" for i, scene in enumerate(scenes)) + "\n")
    srt, vtt = [], ["WEBVTT", ""]
    for number, cue in enumerate(cues, 1):
        srt.extend([str(number), f"{stamp(cue['start'])} --> {stamp(cue['end'])}", cue["text"], ""])
        vtt.extend([f"{stamp(cue['start'], '.')} --> {stamp(cue['end'], '.')}", cue["text"], ""])
    (out / f"{slug}.en.srt").write_text("\n".join(srt))
    (out / f"{slug}.en.vtt").write_text("\n".join(vtt))
    if clock > 720:
        raise ValueError(f"Lesson exceeds 12 minutes: {clock:.1f}s")
    print(json.dumps({"slug": slug, "scenes": len(scenes), "captions": len(cues), "duration_seconds": round(clock, 2)}))


if __name__ == "__main__":
    main()
