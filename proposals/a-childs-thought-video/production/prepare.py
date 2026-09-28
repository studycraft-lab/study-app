from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
WORK=Path('/private/tmp/childs-thought-production')
TITLES=['A whole world inside your head','Pictures at bedtime','Beauty, magic, and adventure','The land of dreams','Morning changes the picture','The ordinary room returns','Looking for the magic','The two worlds','The poet’s choices','Check your understanding','Carry the idea with you']
s=(ROOT/'plan-and-script.md').read_text();body='## Scene 1 —'+s.split('## Scene 1 —',1)[1].split('\n---\n',1)[0]
scenes=[];beats=[]
for section in re.split(r'(?=^## Scene \d+)',body,flags=re.M):
 if not section.strip():continue
 n=int(re.match(r'## Scene (\d+)',section)[1]);lines=[line[2:].strip() for line in section.splitlines() if line.startswith('> ')]
 poem='\n'.join(lines);scenes.append(dict(id=n,title=TITLES[n-1],poem=poem,lines=lines))
 beats.append(dict(scene=n,mode='transition',seconds=1.1,text='',paragraph=-1,question=0))
 read_done=False;pidx=-1;q=0
 for line in section.splitlines():
  if line.startswith('> ') and not read_done:
   cursor=0
   for i,phrase in enumerate(lines):
    beats.append(dict(scene=n,mode='read',text=phrase,phrase=i,span=[cursor,cursor+len(phrase)],paragraph=-1,question=0));cursor+=len(phrase)+1
   beats.append(dict(scene=n,mode='hold',seconds=3 if n in [4,7] else 2,text='',paragraph=-1,question=0));read_done=True
  elif line.startswith('“'):
   pidx+=1;txt=line[1:].removesuffix('”')
   if n==10:
    if txt.startswith('One.'):q=1
    elif txt.startswith('Two.'):q=2
    elif txt.startswith('Three.'):q=3
   sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z‘])',txt)
   for i,sentence in enumerate(sentences):beats.append(dict(scene=n,mode='explain',text=sentence,paragraph=pidx,paragraph_end=i==len(sentences)-1,question=q))
  elif line.startswith('**[THINKING PAUSE'):
   beats.append(dict(scene=n,mode='think',seconds=5,text='',paragraph=pidx,question=q))
beats.append(dict(scene=11,mode='end',seconds=4,text='',paragraph=2,question=0))
for i,b in enumerate(beats):b['id']=i
assert [b['text'] for b in beats if b['mode']=='read']==[l for l in (ROOT/'poem-source.txt').read_text().splitlines()[3:] if l.strip()]
plan=dict(scenes=scenes,beats=beats,source=str(ROOT/'plan-and-script.md'),voice='Niki',narration_engine='Runway eleven_v3',voice_description='expressive American English tutor, Runway Niki',production_revision=1)
(WORK/'lesson-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2))
groups=[]
for b in beats:
 if not b['text']:groups.append(dict(pause=b,index=len(groups)));continue
 if groups and 'pause' not in groups[-1] and groups[-1]['scene']==b['scene'] and groups[-1]['mode']==b['mode']:groups[-1]['beats'].append(b)
 else:groups.append(dict(index=len(groups),scene=b['scene'],mode=b['mode'],beats=[b]))
for g in groups:
 if 'pause' in g:continue
 paragraphs=[];current=[];last=None
 for b in g['beats']:
  if current and b['paragraph']!=last:paragraphs.append(' '.join(current));current=[]
  current.append(b['text']);last=b['paragraph']
 if current:paragraphs.append(' '.join(current))
 raw='\n\n'.join(paragraphs)
 if g['mode']=='read':tag={2:'[warmly]',3:'[wondering]',4:'[warmly]',5:'[thoughtful]',6:'[softly]',7:'[wistful]'}[g['scene']]
 else:tag={1:'[curious]',2:'[warmly]',3:'[excited]',4:'[explaining]',5:'[curious]',6:'[explaining]',7:'[thoughtful]',8:'[explaining]',9:'[animated]',10:'[encouraging]',11:'[warmly]'}[g['scene']]
 g.update(text=tag+' '+raw,plain_text=' '.join(b['text'] for b in g['beats']),speed=.82 if g['mode']=='read' else .9)
 assert len(g['text'])<5000
(WORK/'runway-plan.json').write_text(json.dumps(groups,indent=2,ensure_ascii=False))
print(json.dumps(dict(scenes=len(scenes),beats=len(beats),speech_clips=sum('pause' not in g for g in groups),approx_credits=sum((len(g.get('text',''))+49)//50 for g in groups))))
