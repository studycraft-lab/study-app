"""Package the finished lesson with captions, chapter navigation and script."""
from pathlib import Path
import json, shutil, subprocess, os

ROOT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('LESSON_WORK','/private/tmp/childs-thought-production'))
OUT=Path(os.environ.get('LESSON_OUT',str(ROOT.parents[1]/'output/video/a-childs-thought')))
d=json.loads((WORK/'timeline.json').read_text())
duration_label=f'{int(d["duration"])//60}:{int(d["duration"])%60:02}'
voice_description=d.get('voice_description','synthetic English (India) tutor voice')
revision=d.get('production_revision',2 if d.get('narration_engine') else 1)
movie=OUT/'a-childs-thought.mp4'
subprocess.run([
 'ffmpeg','-v','warning','-y','-i',str(WORK/'picture.mp4'),
 '-i',str(WORK/'narration.wav'),'-i',str(OUT/'a-childs-thought.en.srt'),
 '-i',str(WORK/'chapters.ffmeta'),'-map','0:v:0','-map','1:a:0','-map','2:s:0',
 '-map_metadata','3','-map_chapters','-1','-c:v','copy','-c:a','aac','-b:a','128k',
 '-c:s','mov_text','-metadata:s:s:0','language=eng',
 '-metadata:s:s:0','title=English (also displayed on screen)','-disposition:s:0','0',
 '-movflags','+faststart',str(movie)
],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss','0.5','-i',str(movie),'-frames:v','1',str(OUT/'poster.jpg')],check=True)

script=(ROOT/'plan-and-script.md').read_text().replace('## Video plan and tutor script for approval','## Approved video plan and tutor script').replace('**Draft:** 1 — plan and full script; video production awaits script approval','**Version:** 1 — approved script; full video produced 27 September 2026').replace('**Estimated length:** 8–10 minutes, including thinking pauses',f'**Video length:** {duration_label}, including thinking pauses').replace('### After script approval','### Production workflow')
(OUT/'tutor-script.md').write_text(script)
(ROOT/'plan-and-script.md').write_text(script)
chapters='\n'.join(f'{int(s["start"])//60:02}:{int(s["start"])%60:02}  {s["title"]}' for s in d['scenes'])
(OUT/'chapters.txt').write_text(chapters+'\n')
(OUT/'README.md').write_text(f"""# A Child’s Thought — Class 6 poetry lesson

Robert Louis Stevenson · ICSE Class 6 · {duration_label}

Full HD (1920 × 1080), 24 fps, H.264 video and AAC audio. Expressive American English narration uses the same approved Runway Niki voice as A Little Grain of Gold. No music under the teaching.

The complete twenty-line poem is read in six passages. Original animated storybook illustrations accompany vocabulary, interpretation, contrasts, personification, rhyme, repetition, three oral comprehension questions, and a creative closing challenge. Six five-second thinking pauses let the learner respond; these are not enforced app question checkpoints.

Poem line breaks are preserved. Line highlights and burned-in narration captions follow the recorded speech. An optional English subtitle track is included and disabled by default. The separate WebVTT supports accessible playback.

## Files

- a-childs-thought.mp4 — full lesson
- poster.jpg — cover
- a-childs-thought.en.vtt and .srt — captions
- tutor-script.md — approved script
- chapters.txt — navigation guide

## Sections

{chapters}

Source: user-provided Scan_20260925_174441.pdf, PDF pages 5–6, printed pages 9–10. The source scan and video remain outside the public code repository.
""")
print(str(movie)); print(f'{movie.stat().st_size/1024/1024:.1f} MB')
