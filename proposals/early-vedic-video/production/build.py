"""Build offline narration, timed captions, and chapter markers for the lesson."""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parents[1]
WORK = Path(os.environ.get("LESSON_WORK", "/private/tmp/early-vedic-production"))
OUT = Path(os.environ.get("LESSON_OUT", str(PROJECT / "output/video/early-vedic-civilization")))
MODEL = Path(os.environ.get("KOKORO_MODEL_DIR", "/private/tmp/grain-of-gold-neural/models"))
RATE = 24000
VOICE = "af_heart"


def sentences(text: str) -> list[str]:
    return re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)


def stamp(seconds: float, decimal: str = ",") -> str:
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3600000)
    minutes, milliseconds = divmod(milliseconds, 60000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}{decimal}{milliseconds:03}"


def main() -> None:
    lesson = json.loads((ROOT / "lesson.json").read_text())
    scenes = lesson["scenes"]
    assert len(scenes) == 8
    WORK.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    cache = WORK / "audio-cache"
    cache.mkdir(exist_ok=True)

    settings = ort.SessionOptions()
    settings.intra_op_num_threads = 4
    session = ort.InferenceSession(str(MODEL / "kokoro-v1.0.onnx"), sess_options=settings, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(MODEL / "voices-v1.0.bin"))
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

    def speech(text: str, scene: int, beat: int, kind: str) -> None:
        nonlocal clock
        for sentence in sentences(text):
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
            duration = len(audio) / RATE
            event = {"scene": scene, "beat": beat, "kind": kind, "text": sentence, "start": clock, "end": clock + duration}
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
            for remaining in range(6, 0, -1):
                silence(1.0, scene_index, "think", -1, remaining)
            speech(scene["answer"], scene_index, -1, "reveal")
        silence(0.75, scene_index, "gap")

    sf.write(WORK / "narration.wav", np.concatenate(audio_parts), RATE, subtype="PCM_24")
    timeline = {**lesson, "voice": "Kokoro af_heart (offline)", "duration": clock, "events": events}
    (WORK / "timeline.json").write_text(json.dumps(timeline, indent=2, ensure_ascii=False))
    (OUT / "tutor-script.json").write_text(json.dumps(lesson, indent=2, ensure_ascii=False) + "\n")

    chapter_lines = []
    for index, scene in enumerate(scenes):
        start = next(event["start"] for event in events if event["scene"] == index)
        chapter_lines.append(f"{int(start // 60):02}:{int(start % 60):02}  {scene['title']}")
    (OUT / "chapters.txt").write_text("\n".join(chapter_lines) + "\n")

    srt, vtt = [], ["WEBVTT", ""]
    for number, cue in enumerate(cues, 1):
        srt.extend([str(number), f"{stamp(cue['start'])} --> {stamp(cue['end'])}", cue["text"], ""])
        vtt.extend([f"{stamp(cue['start'], '.')} --> {stamp(cue['end'], '.')}", cue["text"], ""])
    (OUT / "early-vedic-civilization.en.srt").write_text("\n".join(srt))
    (OUT / "early-vedic-civilization.en.vtt").write_text("\n".join(vtt))
    print(json.dumps({"scenes": len(scenes), "captions": len(cues), "duration_seconds": round(clock, 2)}))


if __name__ == "__main__":
    main()
