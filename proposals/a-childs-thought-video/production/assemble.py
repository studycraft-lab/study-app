from pathlib import Path
import json,re,subprocess
import numpy as np
import soundfile as sf
import stable_whisper
W=Path('/private/tmp/childs-thought-production')
ROOT=Path('/Users/aquaraga/Documents/ChatGPT/EdTech')
OUT=ROOT/'output/video/a-childs-thought';OUT.mkdir(parents=True,exist_ok=True)
d=json.load(open('/private/tmp/childs-thought-production/lesson-plan.json'))
plan=json.load(open(W/'runway-plan.json'))
model=stable_whisper.load_faster_whisper('small.en',device='cpu',compute_type='int8',cpu_threads=6,download_root='/private/tmp/grain-of-gold-neural/models/whisper',local_files_only=True)
SR=48000
norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
parts=[];clock=0.;captions=[];diagnostics=[]
byid={b['id']:b for b in d['beats']}
for g in plan:
 if 'pause' in g:
  b=byid[g['pause']['id']];b.update(start=clock,end=clock+b['seconds']);parts.append(np.zeros(round(b['seconds']*SR),dtype='float32'));clock=b['end'];continue
 idx=g['index'];mp3=W/'audio'/f'{idx:03}.mp3';wav=mp3.with_suffix('.wav');meta=mp3.with_name(f'{idx:03}-aligned.json')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(mp3),'-ar',str(SR),'-ac','1',str(wav)],check=True)
 samples,sr=sf.read(wav,dtype='float32');duration=len(samples)/SR
 if not meta.exists():
  result=model.align(str(mp3),g['plain_text'],language='en',verbose=None)
  result.save_as_json(str(meta))
 alignment=json.load(open(meta));words=[w for s in alignment['segments'] for w in s['words']]
 assert norm(''.join(w['word'] for w in words))==norm(g['plain_text']),idx
 offsets=[];at=0
 for w in words:
  length=len(norm(w['word']));offsets.append((at,at+length,w));at+=length
 rows=[byid[b['id']] for b in g['beats']];intervals=[];char=0
 for b in rows:
  target=char+len(norm(b['text']));ws=[w for a,z,w in offsets if z>char and a<target];char=target
  assert ws,(idx,b['id'])
  intervals.append((max(0.,ws[0]['start']),min(duration,ws[-1]['end']),ws))
 for i,(b,(a,z,ws)) in enumerate(zip(rows,intervals)):
  end=intervals[i+1][0] if i+1<len(rows) else duration
  assert end>a and z<=end+.01,(idx,b['id'],a,z,end)
  b.update(start=clock+(a if i else 0),speech_end=clock+z,end=clock+end,audio_group=idx,native_speed=g['speed'],alignment='forced alignment to approved script')
  chunks=[];chunk=[]
  for word in b['text'].split():
   if len(' '.join(chunk+[word]))>91 and chunk:chunks.append(' '.join(chunk));chunk=[]
   chunk.append(word)
  if chunk:chunks.append(' '.join(chunk))
  local_char=0;ws_offsets=[]
  for w in ws:
   ln=len(norm(w['word']));ws_offsets.append((local_char,local_char+ln,w));local_char+=ln
  local_char=0
  for txt in chunks:
   target=local_char+len(norm(txt));cw=[w for a0,z0,w in ws_offsets if z0>local_char and a0<target];local_char=target
   ca=max(a,cw[0]['start']);cz=min(z,cw[-1]['end']);assert cz>ca,(idx,txt)
   captions.append(dict(start=clock+ca,end=clock+cz,text=txt,beat=b['id']))
 diagnostics.append(dict(group=idx,duration=duration,words=len(words),instant_words=sum(w['start']==w['end'] for w in words),low_confidence=[w['word'] for w in words if w.get('probability',1)<.1]))
 parts.append(samples);clock+=duration
 print(f'ALIGNED {idx}: {duration:.2f}s',flush=True)
audio=np.concatenate(parts);assert abs(len(audio)/SR-clock)<.005
sf.write(W/'narration-raw.wav',audio,SR,subtype='PCM_24')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(W/'narration-raw.wav'),'-af','loudnorm=I=-18:TP=-1.5:LRA=11','-ar',str(SR),str(W/'narration.wav')],check=True)
d.update(voice='Niki',narration_engine='Runway eleven_v3',voice_description='expressive American English tutor, Runway Niki',production_revision=1,duration=clock,captions=captions)
for s in d['scenes']:
 rows=[b for b in d['beats'] if b['scene']==s['id']];s.update(start=rows[0]['start'],end=rows[-1]['end'])
for i,b in enumerate(d['beats']):
 if i:assert abs(b['start']-d['beats'][i-1]['end'])<.005
(W/'timeline.json').write_text(json.dumps(d,indent=2,ensure_ascii=False))
(ROOT/'proposals/a-childs-thought-video/production/timeline.json').write_text(json.dumps(d,indent=2,ensure_ascii=False))
def stamp(t,sep=','):
 ms=round(t*1000);h=ms//3600000;ms%=3600000;m=ms//60000;ms%=60000;s=ms//1000;ms%=1000
 return f'{h:02}:{m:02}:{s:02}{sep}{ms:03}'
(OUT/'a-childs-thought.en.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(captions))+'\n')
(OUT/'a-childs-thought.en.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(c["start"],".")} --> {stamp(c["end"],".")}\n{c["text"]}' for c in captions)+'\n')
(W/'chapters.ffmeta').write_text(';FFMETADATA1\ntitle=A Child’s Thought — Class 6 Poetry Lesson\nartist=Illustrated tutor lesson\n')
(W/'alignment-report.json').write_text(json.dumps(diagnostics,indent=2))
print('COMPLETE',clock,len(d['beats']),len(captions),flush=True)
