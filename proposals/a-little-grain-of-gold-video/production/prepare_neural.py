"""Continuous neural narration with phoneme-derived screen and caption timings."""
from pathlib import Path
from dataclasses import asdict
import argparse, copy, hashlib, json, re, subprocess, time
import numpy as np
import soundfile as sf
import onnxruntime as rt
from kokoro_onnx import Kokoro

ROOT=Path(__file__).resolve().parents[1]
MODEL=Path('/private/tmp/grain-of-gold-neural/models')
WORK=Path('/private/tmp/grain-of-gold-production-v2')
OUT=ROOT.parents[1]/'output/video/a-little-grain-of-gold-v2'
WORK.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
(WORK/'audio').mkdir(exist_ok=True)
SR=24000

def stamp(t,sep=','):
    ms=round(t*1000);h=ms//3600000;ms%=3600000;m=ms//60000;ms%=60000;s=ms//1000;ms%=1000
    return f'{h:02}:{m:02}:{s:02}{sep}{ms:03}'

def groups(beats):
    result=[]
    for b in beats:
        key=(b['scene'],b['mode'],b.get('paragraph')) if b['text'] else ('pause',b['id'])
        if result and result[-1][0]==key:result[-1][1].append(b)
        else:result.append((key,[b]))
    return [rows for _,rows in result]

def main(voice):
    d=json.loads((Path('/private/tmp/grain-of-gold-production')/'lesson-plan.json').read_text())
    d['voice']=voice;d['narration_engine']='Kokoro 1.0 via kokoro-onnx 0.6.1'
    d['voice_description']='neural English tutor voice (American)' if voice=='af_heart' else 'neural English tutor voice (British)'
    lang='en-us' if voice.startswith('a') else 'en-gb'
    opts=rt.SessionOptions();opts.intra_op_num_threads=4;opts.inter_op_num_threads=1
    sess=rt.InferenceSession(str(MODEL/'kokoro-v1.0.onnx'),sess_options=opts,providers=['CPUExecutionProvider'])
    k=Kokoro.from_session(sess,str(MODEL/'voices-v1.0.bin'))
    assert k.has_timings
    audio_parts=[];clock=0;captions=[];all_groups=groups(d['beats'])
    for gi,rows in enumerate(all_groups):
        first=rows[0]
        if not first['text']:
            first['start']=clock;clock+=first['seconds'];first['end']=clock
            audio_parts.append(np.zeros(round(first['seconds']*SR),dtype=np.float32));continue
        n=first['scene'];reading=first['mode']=='read'
        # Model-native changes in pace; no artificial time stretching.
        speed=({2:.77,3:.79,4:.80,5:.73,6:.76,7:.73,8:.77,9:.68}.get(n,.78) if reading else .83)
        if not reading and n==9:speed=.79
        if not reading and n==12:speed=.84
        parts=[k.tokenizer.phonemize(b['text'],lang) for b in rows]
        phonemes=' '.join(parts)
        identity=json.dumps([voice,speed,phonemes],ensure_ascii=False)
        key=hashlib.sha256(identity.encode()).hexdigest()[:16]
        wav=WORK/'audio'/f'{gi:03}-{key}.wav';meta=wav.with_suffix('.json')
        if wav.exists() and meta.exists():
            samples,sr=sf.read(wav,dtype='float32');spoken=json.loads(meta.read_text())
        else:
            samples,sr,timings=k.create_timed(phonemes,voice=voice,speed=speed,lang=lang,is_phonemes=True,sentence_pause=.24 if reading else .18,clause_pause=.10 if reading else .07)
            spoken=[asdict(t) for t in timings]
            sf.write(wav,samples,sr,subtype='FLOAT');meta.write_text(json.dumps(spoken,ensure_ascii=False))
        assert sr==SR
        assert ''.join(x['phoneme'] for x in spoken)==phonemes,(gi,'Phoneme alignment mismatch')
        assert np.max(np.abs(samples))>.01
        duration=len(samples)/sr
        char=0;intervals=[]
        for b,p in zip(rows,parts):
            a=spoken[char]['start'];z=spoken[char+len(p)-1]['end'];char+=len(p)+1
            intervals.append((a,z))
        group_tail=.45 if not reading else .08
        for i,(b,p,(a,z)) in enumerate(zip(rows,parts,intervals)):
            b['start']=clock+(a if i else 0)
            b['speech_end']=clock+min(z,duration)
            b['end']=clock+(intervals[i+1][0] if i+1<len(rows) else duration+group_tail)
            b['audio_group']=gi;b['native_speed']=speed;b['alignment']='model phoneme durations'
            assert b['start']<=b['speech_end']<=b['end']+.001
            # Captions track each spoken sentence/poem phrase. Long sentences
            # are split for readability while retaining their audio span.
            chunks=[];chunk=[]
            for word in b['text'].split():
                if len(' '.join(chunk+[word]))>91 and chunk:chunks.append(' '.join(chunk));chunk=[]
                chunk.append(word)
            if chunk:chunks.append(' '.join(chunk))
            weights=[len(x) for x in chunks];total=sum(weights);at=clock+a
            for text,weight in zip(chunks,weights):
                end=at+(z-a)*weight/total
                captions.append(dict(start=at,end=end,text=text,beat=b['id']));at=end
        audio_parts.extend([samples,np.zeros(round(group_tail*SR),dtype=np.float32)])
        clock+=duration+group_tail
        print(f'Narrated group {gi+1}/{len(all_groups)} · scene {n} · {duration:.1f}s',flush=True)
    audio=np.concatenate(audio_parts)
    assert abs(len(audio)/SR-clock)<.01
    sf.write(WORK/'narration-raw.wav',audio,SR,subtype='PCM_24')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'narration-raw.wav'),'-af','loudnorm=I=-18:TP=-1.5:LRA=11','-ar','48000',str(WORK/'narration.wav')],check=True)
    d['duration']=clock;d['captions']=captions
    for s in d['scenes']:
        rows=[b for b in d['beats'] if b['scene']==s['id']]
        s.update(start=rows[0]['start'],end=rows[-1]['end'])
    for i,b in enumerate(d['beats']):
        if i:assert abs(b['start']-d['beats'][i-1]['end'])<.01
    (WORK/'timeline.json').write_text(json.dumps(d,indent=2,ensure_ascii=False))
    (ROOT/'production/timeline-v2.json').write_text(json.dumps(d,indent=2,ensure_ascii=False))
    (OUT/'a-little-grain-of-gold.en.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(captions))+'\n')
    (OUT/'a-little-grain-of-gold.en.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(c["start"],".")} --> {stamp(c["end"],".")}\n{c["text"]}' for c in captions)+'\n')
    (WORK/'chapters.ffmeta').write_text(';FFMETADATA1\ntitle=A Little Grain of Gold — Class 6 Poetry Lesson\nartist=Illustrated tutor lesson\n')
    report=dict(voice=voice,engine=d['narration_engine'],duration_seconds=clock,continuous_speech_groups=sum(bool(g[0]['text']) for g in all_groups),timing='phoneme durations',time_stretching=False)
    (WORK/'narration-report.json').write_text(json.dumps(report,indent=2))
    print('NARRATION COMPLETE',json.dumps(report),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--voice',default='af_heart');args=parser.parse_args();main(args.voice)
