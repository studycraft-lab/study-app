from pathlib import Path
import json, subprocess, time
import numpy as np
import soundfile as sf
import onnxruntime as rt
from kokoro_onnx import Kokoro

WORK=Path('/private/tmp/grain-of-gold-neural')
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parents[1]/'output/video/a-little-grain-of-gold/voice-samples'
OUT.mkdir(parents=True,exist_ok=True)
opts=rt.SessionOptions();opts.intra_op_num_threads=4;opts.inter_op_num_threads=1
session=rt.InferenceSession(str(WORK/'models/kokoro-v1.0.onnx'),sess_options=opts,providers=['CPUExecutionProvider'])
k=Kokoro.from_session(session,str(WORK/'models/voices-v1.0.bin'))
print('Model outputs:',[x.name for x in session.get_outputs()],flush=True)
parts=[
 ('Imagine you are hoping someone will help you. But when that person arrives, they ask you for something instead. How would you feel?',.83,.8),
 ('Then of a sudden thou didst hold out thy right hand and say, "What hast thou to give to me?"',.73,1.1),
 ('The speaker expected the rich king to give something to him. Instead, the king asks him to give. Their expected roles have been reversed. This surprising contrast is an example of irony.',.83,1.0),
 ('I bitterly wept, and wished that I had the heart to give thee my all.',.68,1.2),
]
for voice,lang,name in [('af_heart','en-us','A-warm-conversational'),('bf_emma','en-gb','B-british-storytelling')]:
    clips=[];start=time.time()
    for i,(text,speed,pause) in enumerate(parts):
        audio,sr=k.create(text,voice=voice,speed=speed,lang=lang,sentence_pause=.22,clause_pause=.08)
        clips.extend([audio,np.zeros(round(pause*sr),dtype=np.float32)])
        print(name,i+1,round(len(audio)/sr,2),'seconds',flush=True)
    wav=OUT/(name+'.wav');mp3=OUT/(name+'.mp3')
    sf.write(wav,np.concatenate(clips),sr)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-1.5:LRA=11','-c:a','libmp3lame','-b:a','160k',str(mp3)],check=True)
    print('READY',str(mp3),'generated in',round(time.time()-start,1),'seconds',flush=True)
