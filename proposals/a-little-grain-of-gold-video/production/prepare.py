"""Build an audio-timed lesson from the approved, source-grounded script."""
from pathlib import Path
import argparse, json, math, re, subprocess, wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
WORK = Path('/private/tmp/grain-of-gold-production')
OUT = ROOT.parents[1] / 'output/video/a-little-grain-of-gold'
WORK.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
(WORK/'audio').mkdir(exist_ok=True)

PHRASES = {
2: ['I had gone a-begging from door to door', 'in the village path', 'when thy golden chariot appeared in the distance', 'like a gorgeous dream', 'and I wondered who was this king of all kings!'],
3: ['My hopes rose high', 'and me thought my evil days were at an end,', 'and I stood waiting for alms to be given unasked', 'and for wealth scattered on all sides in the dust.'],
4: ['The chariot stopped where I stood.', 'Thy glance fell on me', 'and thou camest down with a smile.', 'I felt that the luck of my life had come at last.'],
5: ['Then of a sudden thou didst hold out thy right hand', 'and say', '“What hast thou to give to me?”'],
6: ['Ah, what a kingly jest was it', 'to open thy palm to a beggar to beg!', 'I was confused and stood undecided,'],
7: ['and then from my wallet', 'I slowly took out the least little grain of corn', 'and gave it to thee.'],
8: ['But how great my surprise', 'when at the day’s end I emptied my bag on the floor', 'to find a least little grain of gold', 'among the poor heap.'],
9: ['I bitterly wept', 'and wished that I had the heart', 'to give thee my all.'],
}
TITLES = ['Welcome to the poem', 'A wonderful arrival', 'Great expectations', 'The king stops', 'An unexpected question', 'Confusion and hesitation', 'The smallest gift', 'A discovery at day’s end', 'Regret', 'A deeper reading', 'The poet’s choices', 'Check your understanding', 'Carry the message with you']

def parse():
    source=(ROOT/'plan-and-script.md').read_text()
    body=source.split('## Scene 1 —',1)[1].split('\n---\n',1)[0]
    body='## Scene 1 —'+body
    scenes=[]; beats=[]
    for section in re.split(r'(?=^## Scene \d+)',body,flags=re.M):
        if not section.strip(): continue
        n=int(re.match(r'## Scene (\d+)',section)[1]); poem=''
        pidx=-1; q=0; content=[]
        for line in section.splitlines():
            if line.startswith('> '):
                poem=line[2:].strip()
                assert ' '.join(PHRASES[n]) == poem, (n,'Poem mismatch')
                cursor=0
                for i,phrase in enumerate(PHRASES[n]):
                    start=poem.index(phrase,cursor); cursor=start+len(phrase)
                    content.append(dict(mode='read',text=phrase,phrase=i,span=[start,cursor],paragraph=-1,question=q))
                content.append(dict(mode='hold',seconds={5:3,8:3,9:4,6:1}.get(n,2),text='',paragraph=-1,question=q))
            elif line.startswith('“'):
                pidx+=1
                text=line[1:].removesuffix('”')
                if n==12:
                    if text.startswith('One:'):q=1
                    elif text.startswith('Two:'):q=2
                    elif text.startswith('Three:'):q=3
                sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z‘])',text)
                for i,sentence in enumerate(sentences):
                    content.append(dict(mode='explain',text=sentence,paragraph=pidx,question=q,paragraph_end=i==len(sentences)-1))
            elif line.startswith('**[THINKING PAUSE'):
                content.append(dict(mode='think',seconds=5,text='',paragraph=pidx,question=q))
        scenes.append(dict(id=n,title=TITLES[n-1],poem=poem))
        beats.append(dict(scene=n,mode='transition',seconds=1.1,text='',paragraph=-1,question=0))
        for b in content: beats.append(dict(scene=n,**b))
    beats.append(dict(scene=13,mode='end',seconds=4,text='',paragraph=2,question=0))
    for i,b in enumerate(beats): b['id']=i
    data=dict(scenes=scenes,beats=beats,voice='Rishi',source=str(ROOT/'plan-and-script.md'))
    (WORK/'lesson-plan.json').write_text(json.dumps(data,indent=2,ensure_ascii=False))
    print(f'{len(scenes)} scenes; {len(beats)} beats; {sum(bool(b["text"]) for b in beats)} speech segments',flush=True)
    return data

def synthesize(data):
    spoken=[b for b in data['beats'] if b['text']]
    for ix,b in enumerate(spoken):
        stem=WORK/'audio'/f'{b["id"]:03}'
        aiff=stem.with_suffix('.aiff'); wav=stem.with_suffix('.wav')
        if not wav.exists():
            rate='105' if b['mode']=='read' else '120'
            spoken_text=b['text'].replace('“','').replace('”','').replace('‘',"'").replace('’',"'")
            subprocess.run(['say','-v','Rishi','-r',rate,'-o',str(aiff),spoken_text],check=True)
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(aiff),'-ac','1','-ar','44100','-c:a','pcm_s16le',str(wav)],check=True)
        with wave.open(str(wav)) as f:
            frames=f.readframes(f.getnframes()); sr=f.getframerate()
        pcm=np.frombuffer(frames,dtype='<i2')
        # Trim file padding, preserving a small margin around audible speech.
        active=np.flatnonzero(np.abs(pcm.astype(np.int32))>100)
        if len(active)<100: raise ValueError(f'Empty speech: {b["id"]}')
        a=max(0,int(active[0])-int(.035*sr));z=min(len(pcm),int(active[-1])+int(.09*sr))
        pcm=pcm[a:z]
        trim=stem.with_suffix('.trim.wav')
        with wave.open(str(trim),'wb') as f:
            f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(pcm.tobytes())
        b['audio']=str(trim); b['raw_duration']=len(pcm)/sr
        if ix%12==0 or ix==len(spoken)-1:print(f'Narration {ix+1}/{len(spoken)}',flush=True)
    (WORK/'lesson-audio.json').write_text(json.dumps(data,indent=2,ensure_ascii=False))

def stamp(t,sep=','):
    ms=round(t*1000);h=ms//3600000;ms%=3600000;m=ms//60000;ms%=60000;s=ms//1000;ms%=1000
    return f'{h:02}:{m:02}:{s:02}{sep}{ms:03}'

def assemble(data):
    speech=sum(b.get('raw_duration',0) for b in data['beats'])
    pauses=sum(b.get('seconds',0) for b in data['beats'])
    tails=sum((.38 if b.get('paragraph_end') else .16) for b in data['beats'] if b['text'])
    # Preserve an unhurried, consistent pace near the approved 13–15 minute range.
    rate=min(1.0,max(.82,speech/(810-pauses-tails)))
    print(f'Raw speech {speech:.1f}s, pace factor {rate:.3f}',flush=True)
    captions=[];clock=0
    with wave.open(str(WORK/'narration-raw.wav'),'wb') as output:
        output.setnchannels(1);output.setsampwidth(2);output.setframerate(44100)
        for b in data['beats']:
            b['start']=clock
            if b['text']:
                paced=Path(b['audio']).with_suffix('.paced.wav')
                subprocess.run(['ffmpeg','-v','error','-y','-i',b['audio'],'-af',f'atempo={rate:.6f}',str(paced)],check=True)
                with wave.open(str(paced)) as f: pcm=f.readframes(f.getnframes())
                dur=len(pcm)/2/44100
                b['speech_end']=clock+dur
                output.writeframes(pcm)
                words=b['text'].split();chunks=[];chunk=[]
                for w in words:
                    if len(' '.join(chunk+[w]))>91 and chunk:chunks.append(' '.join(chunk));chunk=[]
                    chunk.append(w)
                if chunk:chunks.append(' '.join(chunk))
                weights=[len(re.sub(r'[^\w ]','',x))+6 for x in chunks]; total=sum(weights);cstart=clock
                for cap,weight in zip(chunks,weights):
                    cend=cstart+dur*weight/total
                    captions.append(dict(start=cstart,end=cend,text=cap,beat=b['id']))
                    cstart=cend
                tail=.38 if b.get('paragraph_end') else .16
                output.writeframes(b'\x00\x00'*round(tail*44100));clock+=dur+tail
            else:
                dur=b['seconds'];output.writeframes(b'\x00\x00'*round(dur*44100));clock+=dur
            b['end']=clock
    data['duration']=clock;data['captions']=captions
    for scene in data['scenes']:
        rows=[b for b in data['beats'] if b['scene']==scene['id']]
        scene.update(start=rows[0]['start'],end=rows[-1]['end'])
    (WORK/'timeline.json').write_text(json.dumps(data,indent=2,ensure_ascii=False))
    (ROOT/'production/timeline.json').write_text(json.dumps(data,indent=2,ensure_ascii=False))
    srt='\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(captions))+'\n'
    (OUT/'a-little-grain-of-gold.en.srt').write_text(srt)
    vtt='WEBVTT\n\n'+'\n\n'.join(f'{stamp(c["start"],".")} --> {stamp(c["end"],".")}\n{c["text"]}' for c in captions)+'\n'
    (OUT/'a-little-grain-of-gold.en.vtt').write_text(vtt)
    metadata=';FFMETADATA1\ntitle=A Little Grain of Gold — Class 6 Poetry Lesson\nartist=Illustrated tutor lesson\n'
    for scene in data['scenes']:
        metadata+=f'\n[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(scene["start"]*1000)}\nEND={round(scene["end"]*1000)}\ntitle={scene["title"]}\n'
    (WORK/'chapters.ffmeta').write_text(metadata)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'narration-raw.wav'),'-af','loudnorm=I=-18:TP=-1.5:LRA=9','-ar','48000',str(WORK/'narration.wav')],check=True)
    print(f'Finished narration: {clock/60:.2f} minutes; {len(captions)} caption cues',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['plan','narrate','assemble']);args=parser.parse_args()
    if args.stage=='plan':parse()
    elif args.stage=='narrate':synthesize(json.loads((WORK/'lesson-plan.json').read_text()))
    else:assemble(json.loads((WORK/'lesson-audio.json').read_text()))
