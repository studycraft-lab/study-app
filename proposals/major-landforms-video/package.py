"""Package each detailed Major Landforms video for StudyCraft import."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = {
    "major-landforms-part-1": {
        "title": "Major Landforms of the Earth — Part 1: Continents and Mountains",
        "description": "Detailed revision of Earth's changing surface, the seven continents and fold, block and volcanic mountains, with five recall questions.",
        "source": "User-supplied textbook screenshots, pages 26–30 and 37–39",
    },
    "major-landforms-part-2": {
        "title": "Major Landforms of the Earth — Part 2: Plateaus, Valleys, Plains and People",
        "description": "Detailed revision of plateau types, valleys, plains, minor landforms and their effect on people, with five recall questions.",
        "source": "User-supplied textbook screenshots, pages 30–39",
    },
}


def digest(file: Path) -> str:
    return hashlib.sha256(file.read_bytes()).hexdigest()


def main() -> None:
    slug = sys.argv[1]
    config = CONFIG[slug]
    out = ROOT / "output/video" / slug
    timeline = json.loads((Path(f"/private/tmp/{slug}-production") / "timeline.json").read_text())
    probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration,size", "-show_entries", "stream=codec_name,width,height", "-of", "json", str(out / f"{slug}.mp4")]))
    duration = float(probe["format"]["duration"])
    if not 600 <= duration <= 720 or abs(duration - timeline["duration"]) > 0.1:
        raise ValueError("Rendered duration is invalid.")
    codecs = [s["codec_name"] for s in probe["streams"]]
    if codecs != ["h264", "aac"]:
        raise ValueError(f"Unexpected codecs: {codecs}")
    chapters = [{"title": scene["title"], "start": round(next(event["start"] for event in timeline["events"] if event["scene"] == i), 3)} for i, scene in enumerate(timeline["scenes"])]
    assets = {}
    for name, file, content_type in [
        ("lesson.mp4", f"{slug}.mp4", "video/mp4"),
        ("poster.jpg", "poster.jpg", "image/jpeg"),
        ("captions.en.vtt", f"{slug}.en.vtt", "text/vtt"),
    ]:
        assets[name] = {"file": file, "sha256": digest(out / file), "contentType": content_type}
    manifest = {
        "schemaVersion": "video-1.0", "slug": slug, "contentVersion": 1,
        "title": config["title"], "description": config["description"],
        "source": {
            "board": "ICSE", "grade": 6, "subject": "Geography",
            "chapterTitle": "Major Landforms of the Earth", "chapterNumber": 3,
            "documentName": config["source"], "sha256": "8b21dbaff9db42e51ed0d1835ab15021daa7c6b043bf152b5f7c5f6c68db00dd",
            "sourceManifest": "proposals/major-landforms-video/source-manifest.json", "reviewed": True,
        },
        "durationSeconds": duration, "chapters": chapters, "assets": assets,
        "narration": "The same enthusiastic English tutor voice used for the approved Early Vedic video.",
    }
    target = ROOT / "lesson-packs/icse-6-geography" / slug / "video-v1.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    (out / "qa.json").write_text(json.dumps({"durationSeconds": duration, "dimensions": [1600, 900], "codecs": codecs, "bytes": int(probe["format"]["size"]), "chapterCount": len(chapters), "questionCount": sum(bool(s.get("question")) for s in timeline["scenes"]), "captionCount": sum(1 for line in (out / f"{slug}.en.vtt").read_text().splitlines() if " --> " in line), "inTenToTwelveMinuteRange": 600 <= duration <= 720}, indent=2) + "\n")
    (out / "README.md").write_text(f"# {config['title']}\n\nPart of a two-video Geography revision, {duration / 60:.1f} minutes, with original explanatory diagrams, five recall pauses, the approved lively English tutor voice, captions and chapter markers.\n\nSource: {config['source']}. The source screenshots remain outside the repository. See `proposals/major-landforms-video/source-manifest.json` for their hashes.\n\nThe lesson manifest is `lesson-packs/icse-6-geography/{slug}/video-v1.json`.\n")
    print(json.dumps({"slug": slug, "durationSeconds": duration, "manifest": str(target)}))


if __name__ == "__main__":
    main()
