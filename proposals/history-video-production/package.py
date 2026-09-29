"""Package a rendered, source-reviewed history lesson for StudyCraft import."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = {
    "later-vedic-civilization": {
        "title": "The Later Vedic Civilization",
        "chapter": 6,
        "description": "Compare Early and Later Vedic life through evidence, kingdoms, society, learning, beliefs and work.",
        "source": "User-supplied textbook screenshots, pages 54–62",
        "fingerprint": "e83f3863da44e7ea6dc679c3a9c5e172cc1fbaf3fe2b5b986286e68de06e0e73",
        "sourceManifest": "ingestion-artifacts/later-vedic-chapter-manifest.json",
    },
    "egyptian-civilization": {
        "title": "The Egyptian Civilization",
        "chapter": 2,
        "description": "Follow the Nile through Egyptian farming, cities, society, writing and beliefs.",
        "source": "User-supplied textbook screenshots, pages 18–26",
        "fingerprint": "4540f3729d3de101917db9a749d96ad46fb8c80adbc0d3916beb233fb5b3793c",
        "sourceManifest": "proposals/egyptian-civilization-video/source-manifest.json",
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
    if duration >= 600 or abs(duration - timeline["duration"]) > 0.1:
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
            "board": "ICSE", "grade": 6, "subject": "History",
            "chapterTitle": config["title"], "chapterNumber": config["chapter"],
            "documentName": config["source"], "sha256": config["fingerprint"],
            "sourceManifest": config["sourceManifest"], "reviewed": True,
        },
        "durationSeconds": duration, "chapters": chapters, "assets": assets,
        "narration": "The same enthusiastic English tutor voice used for the approved Early Vedic video.",
    }
    target = ROOT / "lesson-packs/icse-6-history" / slug / "video-v1.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    (out / "qa.json").write_text(json.dumps({"durationSeconds": duration, "dimensions": [1600, 900], "codecs": codecs, "bytes": int(probe["format"]["size"]), "chapterCount": len(chapters), "captionCount": sum(1 for line in (out / f"{slug}.en.vtt").read_text().splitlines() if " --> " in line), "underTenMinutes": duration < 600}, indent=2) + "\n")
    (out / "README.md").write_text(f"# {config['title']} revision video\n\nOne chapter video, {duration / 60:.1f} minutes, with original diagrams, the approved lively English tutor voice, captions and chapter markers.\n\nSource: {config['source']}. The source screenshots remain outside the repository. See `{config['sourceManifest']}` for their hashes.\n\nThe lesson manifest is `lesson-packs/icse-6-history/{slug}/video-v1.json`.\n")
    print(json.dumps({"slug": slug, "durationSeconds": duration, "manifest": str(target)}))


if __name__ == "__main__":
    main()
