"""Package the finished lesson with captions, chapter navigation and script."""
from pathlib import Path
import json, shutil, subprocess, os

ROOT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('LESSON_WORK','/private/tmp/grain-of-gold-production'))
OUT=Path(os.environ.get('LESSON_OUT',str(ROOT.parents[1]/'output/video/a-little-grain-of-gold')))
d=json.loads((WORK/'timeline.json').read_text())
duration_label=f'{int(d["duration"])//60}:{int(d["duration"])%60:02}'
voice_description=d.get('voice_description','synthetic English (India) tutor voice')
revision=d.get('production_revision',2 if d.get('narration_engine') else 1)
movie=OUT/'a-little-grain-of-gold.mp4'
subprocess.run([
 'ffmpeg','-v','warning','-y','-i',str(WORK/'picture.mp4'),
 '-i',str(WORK/'narration.wav'),'-i',str(OUT/'a-little-grain-of-gold.en.srt'),
 '-i',str(WORK/'chapters.ffmeta'),'-map','0:v:0','-map','1:a:0','-map','2:s:0',
 '-map_metadata','3','-map_chapters','-1','-c:v','copy','-c:a','aac','-b:a','128k',
 '-c:s','mov_text','-metadata:s:s:0','language=eng',
 '-metadata:s:s:0','title=English (also displayed on screen)','-disposition:s:0','0',
 '-movflags','+faststart',str(movie)
],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss','0.5','-i',str(movie),'-frames:v','1',str(OUT/'poster.jpg')],check=True)

script=(ROOT/'plan-and-script.md').read_text()
script=script.replace('## Video plan and tutor script for approval','## Video plan and tutor script')
script=script.replace('**Draft:** 1 — script and storyboard only; video production awaits approval',f'**Version:** {revision} — approved script; video produced 27 September 2026')
script=script.replace('**Proposed length:** approximately 13–15 minutes, including thinking pauses',f'**Video length:** {duration_label}, including thinking pauses')
script=script.replace('These are planning estimates. Final scene timings and highlights will follow the recorded narration.','The table records the original planning estimates. The finished video follows the actual narration timing.')
script=script.replace('## Production after script approval','## Production workflow')
script=script.replace('Approval at this stage is for the proposed teaching approach, script, and visual treatment. No video has been produced yet.','The approved lesson has been produced as an MP4 with original animated illustrations, synthetic English narration, captions, and a chapter timestamp guide.')
(OUT/'tutor-script.md').write_text(script)

def stamp(t):
 t=int(t);return f'{t//60:02}:{t%60:02}'
chapters='\n'.join(f'{stamp(s["start"])}  {s["title"]}' for s in d['scenes'])
(OUT/'chapters.txt').write_text(chapters+'\n')
readme=f'''# A Little Grain of Gold — Class 6 poetry lesson

**Poet:** Rabindranath Tagore  
**Length:** {duration_label}  
**Video:** 1920 × 1080, 24 fps, H.264 MP4 with AAC audio  
**Narration:** {voice_description}  
**Audience:** Class 6, ICSE

Open `a-little-grain-of-gold.mp4` in a video player. Captions are already visible on screen, alongside phrase highlighting during the poem reading. Use full-screen playback for comfortable reading. The six thinking pauses last five seconds; pause the video whenever more time is useful.

The video contains the full approved script and all eight poem passages. It includes vocabulary, interpretation, poetic devices, three comprehension questions with answers, and a final recap. Original vector illustrations animate the chariot's arrival, the king's request, the giving of the grain, and the discovery at day's end.

## Files

- `a-little-grain-of-gold.mp4`: complete lesson with visible captions.
- `a-little-grain-of-gold.en.srt`: captions for editing or uploading.
- `a-little-grain-of-gold.en.vtt`: captions in WebVTT format.
- `tutor-script.md`: companion script and storyboard.
- `chapters.txt`: navigation timestamps.
- `poster.jpg`: cover image.

An additional English subtitle track is included in the MP4 and is disabled by default because the captions are already visible in the picture.

## Chapters

```
{chapters}
```

The poem text follows the user-supplied scan, `Scan_20260927_112154.pdf`. Screen wrapping is for readability and does not create new poetic line numbers. The script distinguishes the literal story from its spiritual interpretation.
'''
if revision==2:
 readme+='\nRevision 2 uses the selected A voice (Kokoro af_heart), with continuous paragraph narration and highlights timed from model phoneme durations. No post-production time stretching was applied. Model source: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M); inference: [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx).\n'
if revision==3:
 readme+='\nRevision 3 uses the approved expressive American tutor delivery from Runway (Niki), with the full script regenerated, phrase timings aligned to the recorded speech, and six five-second thinking pauses. No post-production time stretching was applied.\n'
(OUT/'README.md').write_text(readme)
print(str(movie))
print(f'{movie.stat().st_size/1024/1024:.1f} MB')
