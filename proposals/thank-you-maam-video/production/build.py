"""Build offline narration, captions, and a video timeline for Thank You, Ma’am."""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "plan-and-script.md"
WORK = Path(os.environ.get("LESSON_WORK", "/private/tmp/thank-you-maam-production"))
OUT = Path(os.environ.get("LESSON_OUT", str(ROOT.parents[1] / "output/video/thank-you-maam")))
MODEL = Path(os.environ.get("KOKORO_MODEL_DIR", "/private/tmp/grain-of-gold-neural/models"))
SAMPLE_RATE = 24000
THINK_SECONDS = 7


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("*", "")).strip()


def scenes() -> list[dict]:
    source = SCRIPT.read_text()
    matches = list(re.finditer(r"(?m)^## Scene (\d+) — ([^\n]+)$", source))
    result = []
    for index, match in enumerate(matches):
        section = source[match.end() : matches[index + 1].start() if index + 1 < len(matches) else len(source)]
        fields = {}
        for item in re.finditer(r"(?ms)^\*\*(VISUAL|SAY|ASK|REVEAL|AFTER):\*\* (.*?)(?=\n\n\*\*(?:VISUAL|SAY|ASK|REVEAL|AFTER):\*\*|\Z)", section):
            fields[item.group(1).lower()] = clean(item.group(2))
        if not all(fields.get(field) for field in ("visual", "say", "ask", "reveal")):
            raise ValueError(f"Scene {match.group(1)} is incomplete: {fields.keys()}")
        result.append({"number": int(match.group(1)), "title": match.group(2), **fields})
    if len(result) != 10 or [s["number"] for s in result] != list(range(1, 11)):
        raise ValueError("Expected ten ordered scenes")
    return result


def sentences(text: str) -> list[str]:
    # The script avoids abbreviations and uses each sentence as one caption cue.
    pieces = re.split(r"(?<=[.!?])\s+(?=[A-Z“])", clean(text))
    return [piece for piece in pieces if piece]


def timestamp(seconds: float, decimal: str = ",") -> str:
    millis = int(round(seconds * 1000))
    hours, millis = divmod(millis, 3600000)
    minutes, millis = divmod(millis, 60000)
    secs, millis = divmod(millis, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}{decimal}{millis:03}"


def build_audio() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    cache = WORK / "audio-cache"
    cache.mkdir(exist_ok=True)
    scene_data = scenes()
    settings = ort.SessionOptions()
    settings.intra_op_num_threads = 4
    session = ort.InferenceSession(str(MODEL / "kokoro-v1.0.onnx"), sess_options=settings, providers=["CPUExecutionProvider"])
    engine = Kokoro.from_session(session, str(MODEL / "voices-v1.0.bin"))
    segments: list[dict] = []
    samples: list[np.ndarray] = []
    captions: list[dict] = []
    current = 0.0

    def add_silence(duration: float, scene: dict, kind: str, count: int | None = None) -> None:
        nonlocal current
        audio = np.zeros(int(round(duration * SAMPLE_RATE)), dtype=np.float32)
        samples.append(audio)
        event = {"scene": scene["number"], "title": scene["title"], "kind": kind, "text": scene["ask"] if kind == "think" else "", "start": current, "end": current + len(audio) / SAMPLE_RATE}
        if count is not None:
            event["count"] = count
        segments.append(event)
        current = event["end"]

    def add_speech(text: str, scene: dict, kind: str) -> None:
        nonlocal current
        for sentence in sentences(text):
            identity = hashlib.sha256(f"af_heart|0.98|{sentence}".encode()).hexdigest()
            file = cache / f"{identity}.wav"
            if file.exists():
                audio, rate = sf.read(file, dtype="float32")
                if rate != SAMPLE_RATE:
                    raise ValueError(f"Unexpected sample rate in {file}")
            else:
                audio, rate = engine.create(sentence, voice="af_heart", speed=0.98, lang="en-us", sentence_pause=0.0, clause_pause=0.05)
                if rate != SAMPLE_RATE:
                    raise ValueError(f"Unexpected sample rate from Kokoro: {rate}")
                audio = np.asarray(audio, dtype=np.float32).reshape(-1)
                sf.write(file, audio, SAMPLE_RATE)
            if len(audio) < SAMPLE_RATE // 5:
                raise ValueError(f"TTS returned short audio: {sentence}")
            samples.append(audio)
            duration = len(audio) / SAMPLE_RATE
            event = {"scene": scene["number"], "title": scene["title"], "kind": kind, "text": sentence, "start": current, "end": current + duration}
            segments.append(event)
            captions.append(event)
            current = event["end"]
            add_silence(0.22 if kind != "ask" else 0.5, scene, "gap")

    for scene in scene_data:
        add_speech(scene["say"], scene, "say")
        add_speech(scene["ask"], scene, "ask")
        for remaining in range(THINK_SECONDS, 0, -1):
            add_silence(1.0, scene, "think", remaining)
        add_speech(scene["reveal"], scene, "reveal")
        if scene.get("after"):
            add_speech(scene["after"], scene, "after")
        add_silence(0.8, scene, "gap")

    sf.write(WORK / "narration-raw.wav", np.concatenate(samples), SAMPLE_RATE)
    timeline = {"title": "Thank You, Ma’am", "author": "Langston Hughes, adapted", "source_sha256": "88c466b90488c9d5eccc3c672e052c0046f4e1e5bfaa568b7eb166bef26d6aef", "voice": "Kokoro af_heart, offline", "duration": current, "scenes": scene_data, "segments": segments}
    (WORK / "timeline.json").write_text(json.dumps(timeline, indent=2, ensure_ascii=False))
    shutil.copyfile(SCRIPT, OUT / "tutor-script.md")
    (OUT / "chapters.txt").write_text("\n".join(f"{int(next(segment['start'] for segment in segments if segment['scene'] == scene['number'])//60):02}:{int(next(segment['start'] for segment in segments if segment['scene'] == scene['number'])%60):02}  {scene['title']}" for scene in scene_data) + "\n")
    srt, vtt = [], ["WEBVTT", ""]
    for number, event in enumerate(captions, 1):
        srt.extend([str(number), f"{timestamp(event['start'])} --> {timestamp(event['end'])}", event["text"], ""])
        vtt.extend([f"{timestamp(event['start'], '.')} --> {timestamp(event['end'], '.')}", event["text"], ""])
    (OUT / "thank-you-maam.en.srt").write_text("\n".join(srt))
    (OUT / "thank-you-maam.en.vtt").write_text("\n".join(vtt))
    print(json.dumps({"scenes": len(scene_data), "speech_segments": len(captions), "duration_seconds": round(current, 2), "timeline": str(WORK / 'timeline.json')}))


if __name__ == "__main__":
    if sys.argv[1:] != ["audio"]:
        raise SystemExit("usage: build.py audio")
    build_audio()
