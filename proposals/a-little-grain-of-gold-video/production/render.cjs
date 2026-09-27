/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS video renderer. */
/* Standalone video compositor. Original vector artwork, timed from actual audio. */
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const {once}=require('events');
const {createCanvas,GlobalFonts}=require('/Users/aquaraga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const WORK=process.env.LESSON_WORK||'/private/tmp/grain-of-gold-production';
const ROOT=path.resolve(__dirname,'..');
const OUT=process.env.LESSON_OUT||path.resolve(ROOT,'../../output/video/a-little-grain-of-gold');
const plan=JSON.parse(fs.readFileSync(path.join(WORK,fs.existsSync(path.join(WORK,'timeline.json'))?'timeline.json':'lesson-plan.json'),'utf8'));
for(const [file,name] of [['Georgia.ttf','Poem'],['Georgia Italic.ttf','PoemItalic'],['Arial.ttf','Tutor'],['Arial Bold.ttf','TutorBold']])GlobalFonts.registerFromPath('/System/Library/Fonts/Supplemental/'+file,name);
const W=1920,H=1080,FPS=24;
const C={paper:'#F6F1E7',ink:'#203D38',muted:'#63726A',green:'#214E45',gold:'#E3BA62',glow:'#F8E1A4',line:'#DCDACD',white:'#FFFDF7',rust:'#B96947',blue:'#467E86',skin:'#AA6846',dark:'#352D2B'};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>1-(1-clamp(x))**3;
function rr(c,x,y,w,h,r=18,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
function line(c,points,color,width=3){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
function poly(c,points,fill){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill()}
function pth(c,d,fill,stroke,width=2){const {Path2D}=require('/Users/aquaraga/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');const p=new Path2D(d);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}}
function text(c,str,x,y,size=36,color=C.ink,font='Tutor',align='left'){c.font=`${size}px ${font}`;c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(str,x,y)}
function wrap(c,str,max,size=36,font='Tutor'){if(str.includes('\n'))return str.split('\n').flatMap(part=>wrap(c,part,max,size,font));c.font=`${size}px ${font}`;const lines=[];let row='';for(const w of str.split(/\s+/)){const n=row?row+' '+w:w;if(c.measureText(n).width>max&&row){lines.push(row);row=w}else row=n}if(row)lines.push(row);return lines}
function block(c,str,x,y,max,size=36,lh=48,color=C.ink,font='Tutor',align='left'){const lines=wrap(c,str,max,size,font);for(let i=0;i<lines.length;i++)text(c,lines[i],x,y+i*lh,size,color,font,align);return lines.length*lh}
function pill(c,label,x,y,fill=C.green,fg=C.white,size=23){c.font=`${size}px TutorBold`;const w=c.measureText(label).width+34;rr(c,x,y,w,40,20,fill);text(c,label,x+17,y+28,size,fg,'TutorBold');return w}
function grain(c,x,y,s=1,gold=false,angle=-.4){c.save();c.translate(x,y);c.rotate(angle);ellipse(c,0,0,12*s,23*s,gold?C.gold:'#C99C5D',gold?'#A77521':'#A17A49');line(c,[[0,-16*s],[0,16*s]],gold?'#FCECC2':'#E7C491',2*s);c.restore()}
function pouch(c,x,y,s=1,open=false){c.save();c.translate(x,y);c.scale(s,s);pth(c,'M -35 -50 Q -53 -21 -48 24 Q -42 48 0 49 Q 42 48 48 24 Q 53 -21 35 -50 Z','#B48054','#835E3E',3);ellipse(c,0,-50,35,open?13:5,open?'#654933':'#CC9D6B');line(c,[[-37,-43],[36,-43]],'#F1CC8A',6);line(c,[[23,-44],[41,-14]],'#E9C084',3);c.restore()}
function sparkle(c,x,y,s=1,alpha=1){c.save();c.globalAlpha=alpha;pth(c,`M ${x} ${y-16*s} Q ${x+3*s} ${y-3*s} ${x+13*s} ${y} Q ${x+3*s} ${y+3*s} ${x} ${y+16*s} Q ${x-3*s} ${y+3*s} ${x-13*s} ${y} Q ${x-3*s} ${y-3*s} ${x} ${y-16*s}`,C.gold);c.restore()}
function person(c,x,y,s=1,role='speaker',pose='calm',offer=0,holding=true){
 c.save();c.translate(x,y);c.scale(s,s);
 const royal=role==='king',skin=royal?'#B67850':C.skin,cloth=royal?'#AD5840':'#3F797D';
 ellipse(c,0,5,54,10,'#31493A20');
 // Sandals, legs, dhoti and long tunic.
 line(c,[[-17,-66],[-24,-9]],skin,15);line(c,[[18,-66],[24,-9]],skin,15);
 ellipse(c,-26,-3,18,7,'#73513B');ellipse(c,27,-3,18,7,'#73513B');
 pth(c,'M -35 -98 L 38 -98 L 31 -24 L 4 -30 L -7 -72 L -12 -28 L -39 -29 Z',royal?'#DBAB52':'#E6DBC2');
 pth(c,'M -34 -164 Q 0 -183 34 -164 L 44 -73 Q 0 -61 -44 -73 Z',cloth);
 if(royal){pth(c,'M -29 -163 Q -63 -139 -48 -68 L -34 -63 L -23 -164',C.gold);line(c,[[-30,-166],[-32,-79]],'#F3D897',5);line(c,[[33,-165],[37,-78]],'#E5B962',5);ellipse(c,0,-155,11,12,C.gold);ellipse(c,0,-155,5,6,'#52776B')}
 else {pth(c,'M -23 -168 Q -6 -145 25 -162 L 29 -139 Q 5 -124 -23 -143 Z','#E5C886');pth(c,'M 12 -139 L 29 -140 L 20 -88 L 6 -91 Z','#DBB972');}
 // Rear arm and pouch.
 line(c,[[-33,-155],[-51,-116],[-46,-78]],cloth,19);ellipse(c,-45,-73,10,13,skin);
 if(!royal&&holding)pouch(c,-45,-81,.43,true);
 const reach=(royal||pose==='give')?offer:0;
 const ex=39+55*reach,ey=-104+12*reach;
 line(c,[[30,-157],[48,-127],[ex,ey]],cloth,18);
 line(c,[[ex,ey],[ex+16+8*reach,ey-3]],skin,12);
 ellipse(c,ex+17+8*reach,ey-4,14,7,skin);
 // Neck, ears, face and hair.
 rr(c,-12,-194,24,34,8,skin);ellipse(c,-33,-206,8,12,skin);ellipse(c,33,-206,8,12,skin);
 ellipse(c,0,-216,35,43,skin);pth(c,'M -35 -210 Q -44 -261 -8 -261 Q 41 -264 36 -208 L 27 -225 Q 8 -246 -14 -239 L -29 -222 Z',C.dark);
 if(royal){poly(c,[[-34,-249],[-38,-279],[-20,-269],[-5,-291],[7,-269],[27,-285],[34,-249]],C.gold);rr(c,-35,-254,70,13,4,'#DBA648');ellipse(c,0,-249,6,7,'#4C7770');}
 else{pth(c,'M -30 -189 Q -21 -175 -1 -175 Q 25 -177 31 -196 Q 24 -187 13 -190 Q 0 -194 -10 -188 Q -25 -189 -30 -189',C.dark)}
 ellipse(c,-13,-217,2.5,3,C.dark);ellipse(c,13,-217,2.5,3,C.dark);
 const sad=pose==='sad',confused=pose==='confused';
 line(c,[[-21,-226],[-9,-(sad?231:228)]],C.dark,2.4);line(c,[[9,-(confused?230:228)],[21,-224]],C.dark,2.4);
 pth(c,'M 1 -216 L -3 -204 L 4 -203',null,'#885337',2);
 pth(c,sad?'M -9 -187 Q 0 -195 10 -188':'M -10 -194 Q 0 -188 11 -195',null,'#713F32',2);
 if(sad){pth(c,'M 17 -210 Q 10 -199 17 -197 Q 24 -198 17 -210','#8DBBBB')}
 c.restore();
}
function wheel(c,x,y,r,rot=0){ellipse(c,x,y,r,r,'#F0CA79','#92672F');c.save();c.translate(x,y);c.rotate(rot);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,[[0,0],[Math.cos(a)*(r-5),Math.sin(a)*(r-5)]],'#996C34',3)}ellipse(c,0,0,7,7,'#A4783D');c.restore()}
function horse(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);ellipse(c,0,-50,49,26,'#F2E6CA');pth(c,'M 28 -59 L 40 -111 Q 53 -129 63 -116 L 79 -85 Q 72 -75 52 -85 L 45 -38 Z','#F2E6CA');poly(c,[[43,-114],[40,-139],[52,-121]],'#EAD9B9');pth(c,'M 36 -106 Q 27 -96 24 -63 L 32 -55 L 45 -104 Z','#795D43');for(const [a,b] of [[-31,-23],[-13,-9],[20,13],[34,37]]){line(c,[[a,-35],[b,2]],'#DAC5A0',9);line(c,[[b,2],[b+9,2]],'#765B42',6)}pth(c,'M -43 -56 Q -69 -58 -66 -23',null,'#735B44',8);ellipse(c,60,-107,2.5,2.5,C.dark);line(c,[[51,-92],[75,-86]],'#996A3E',3);line(c,[[-12,-66],[-11,-26]],'#B38E50',6);c.restore()}
function chariot(c,x,y,s=1,move=0,passenger=true){c.save();c.translate(x,y);c.scale(s,s);line(c,[[-10,-30],[85,-38]],'#BD8D47',6);horse(c,111,0,.74);if(passenger)person(c,-81,-16,.47,'king');pth(c,'M -130 -75 Q -83 -45 -33 -75 L -15 -22 L -138 -22 Z','#DEAF50','#9D7432',3);line(c,[[-133,-30],[-133,-162]],'#A87831',6);line(c,[[-26,-36],[-26,-163]],'#A87831',6);pth(c,'M -151 -163 Q -137 -203 -80 -212 Q -30 -206 -8 -163 Z','#AE5C41','#78432E',3);line(c,[[-149,-163],[-9,-163]],'#E5BD61',7);line(c,[[-80,-212],[-80,-237]],'#AD7E32',4);poly(c,[[-80,-237],[-35,-226],[-80,-219]],'#B66247');wheel(c,-112,-13,31,move);wheel(c,-41,-13,31,move);ellipse(c,-82,-47,14,13,'#54847B');c.restore()}
function background(c,dusk=false,t=0){
 const sky=c.createLinearGradient(0,0,0,570);sky.addColorStop(0,dusk?'#B9BEC9':'#DAE9DD');sky.addColorStop(1,dusk?'#F1D0A6':'#F5ECCF');c.fillStyle=sky;c.fillRect(0,0,600,570);
 ellipse(c,471,85,42,42,dusk?'#EAB773':'#FBEDB6');
 const dx=Math.sin(t*.08)*12;
 for(const [x,y,s] of [[105+dx,78,.8],[305-dx,132,.6]]){ellipse(c,x,y,52*s,13*s,'#FFFDF566');ellipse(c,x+25*s,y-9*s,29*s,19*s,'#FFFDF566')}
 pth(c,'M -20 288 Q 112 197 240 291 Q 380 201 620 270 L 620 570 L -20 570 Z',dusk?'#869284':'#A8BD92');
 pth(c,'M -20 365 Q 180 296 330 352 Q 460 310 620 335 L 620 570 L -20 570 Z',dusk?'#697D6C':'#7D9E7B');
 pth(c,'M 279 313 Q 343 353 222 445 Q 171 480 252 570 L 600 570 Q 346 449 370 390 Q 387 348 310 310 Z',dusk?'#CBA885':'#D8C39A');
 // Clay village homes.
 for(const [x,y,s] of [[55,276,.72],[185,284,.55]]){c.save();c.translate(x,y);c.scale(s,s);rr(c,-37,-38,94,72,2,'#D4AC7A');poly(c,[[-52,-38],[8,-91],[72,-38]],'#AE744B');rr(c,-3,-2,24,36,3,'#6D6351');rr(c,33,-20,16,17,2,'#716F54');c.restore()}
 line(c,[[546,327],[548,202]],'#6B6F48',13);ellipse(c,533,199,45,56,dusk?'#607662':'#6B946B');ellipse(c,565,215,35,44,dusk?'#5F7663':'#759C71');
 for(let i=0;i<15;i++){const x=(i*127+29)%580,y=486+(i*31)%78;line(c,[[x,y],[x-4,y-10]],'#658564',2);if(i%4===0)ellipse(c,x-4,y-12,3,3,'#DAB96E')}
}
const moods={2:['Wonder','A magnificent chariot appears.'],3:['Hope','He imagines receiving gifts.'],4:['Expectation','The king stops and smiles.'],5:['Surprise','The expected roles are reversed.'],6:['Confusion','He cannot decide what to do.'],7:['Reluctance','He chooses one tiny grain.'],8:['Amazement','He discovers something precious.'],9:['Regret','He wishes he had given more.']};
const terms=[
 ['a-begging','a-begging','going from door to door, asking for help'],['chariot','chariot','a vehicle pulled by horses'],['gorgeous','gorgeous','very beautiful'],['simile','like a gorgeous dream','a comparison using “like” or “as”'],['me thought','me thought','it seemed to me'],['evil days','evil days','days of hardship and suffering'],['alms','alms','gifts given to people in need'],['unasked','unasked','without having to ask'],['glance','glance','a quick look'],['camest','thou camest','you came'],['hast','hast','have'],['didst','thou didst','you did'],['kingly','kingly jest','a royal joke'],['jest','kingly jest','a royal joke'],['undecided','undecided','unable to make up one’s mind'],['wallet','wallet','a small bag or pouch'],['corn','corn','grain'],['slowly','slowly','a clue that he is hesitating'],['least little','least little grain','the smallest possible gift'],['poor heap','poor heap','his small collection of possessions'],['bitterly','bitterly wept','cried with deep sorrow'],['had the heart','had the heart','had the willingness or generosity'],['my all','my all','everything I had']
];
function focus(b,scene){if(b.mode==='read')return {span:b.span};if(b.mode!=='explain'||!scene.poem)return {};const low=b.text.toLowerCase();for(const [match,quote,def] of terms){if(low.includes(match)&&scene.poem.toLowerCase().includes(quote)){const a=scene.poem.toLowerCase().indexOf(quote);return {span:[a,a+quote.length],quote,def}}}return {}}
function sceneArt(c,b,scene,t){
 const n=b.scene,st=t-(scene.start||0);const event=(phrase,part=0)=>{const e=plan.beats.find(v=>v.scene===n&&v.mode==='read'&&v.phrase===phrase);return e?.start!==undefined?e.start-(scene.start||0)+((e.speech_end||e.end)-e.start)*part:8};c.save();c.translate(1260,242);rr(c,0,0,580,536,28);c.clip();
 background(c,n===8||n===9,st);
 if(n<=2){const arrival=n===2?ease((st-event(2))/8):0;person(c,115,454,.83,'speaker');if(n===2)chariot(c,660-arrival*255,410,.88,arrival*4);}
 else if(n===3){chariot(c,408,409,.65);person(c,157,470,.9);ellipse(c,177,100,99,64,'#FFFDF7');ellipse(c,138,177,12,12,'#FFFDF7');ellipse(c,130,198,7,7,'#FFFDF7');for(let i=0;i<4;i++){ellipse(c,135+i*29,99+(i%2)*15,12,12,C.gold);line(c,[[135+i*29,92+(i%2)*15],[135+i*29,106+(i%2)*15]],'#A77A31',2)}text(c,'HIS HOPE',177,55,18,C.muted,'TutorBold','center');}
 else if(n>=4&&n<=7){const down=n===4?ease((st-event(2))/4):1;chariot(c,468,404,.57,0,false);person(c,160,470,.95,'speaker',n===6?'confused':n===7?'give':'calm',n===7?ease((st-event(1))/4):0);c.save();c.translate(355+35*(1-down),455-60*(1-down));c.scale(-1,1);person(c,0,0,.91,'king','calm',n>=5?ease((st-1)/3):0);c.restore();if(n===7&&st>event(1)){grain(c,224+ease((st-event(1))/7)*35,376,.45,false);}}
 else if(n===8||n===9){person(c,208,456,.99,'speaker',n===9?'sad':'calm',0,false);const pour=n===9?9:st-event(1);const tilt=pour>0&&pour<7?Math.sin(clamp(pour/7)*Math.PI)*1.65:0;c.save();c.translate(371,424);c.rotate(-tilt);pouch(c,0,0,.64,true);c.restore();for(let i=0;i<9;i++){const fall=n===9?1:ease((pour-1-i*.22)/1.4);if(fall>0)grain(c,340+((316+(i*27)%190)-340)*fall,406+(77+(i%3)*11)*fall,.21,false,i*.6);}const revealed=n===9||st>event(2,.72);if(revealed){grain(c,374,476,.38,true);for(let i=0;i<3;i++)sparkle(c,355+i*20,459+(i%2)*27,.5,.5+.35*Math.sin(t*1.7+i));ellipse(c,448,184,78,78,'#FFF7DD');grain(c,448,184,1.6,true);text(c,'ONE TINY GRAIN',448,286,19,C.ink,'TutorBold','center');}}
 else if(n===10){const p=b.paragraph;if(p<=1){person(c,305,456,1.14,'king','calm',.8);sparkle(c,204,108,1.2);sparkle(c,400,165,.75);}else if(p===2){pouch(c,163,308,1.35,true);grain(c,390,296,2.7,true);sparkle(c,445,207,1.2);text(c,'OUR GIFT',165,420,22,C.ink,'TutorBold','center');text(c,'ITS VALUE',389,420,22,C.ink,'TutorBold','center');}else{c.save();c.translate(95,121);rr(c,0,0,391,281,24,C.white);text(c,'A WILLING',195,77,36,C.green,'TutorBold','center');text(c,'HEART',195,125,42,C.green,'TutorBold','center');pth(c,'M 195 220 C 169 202 137 181 144 157 C 151 134 181 138 195 159 C 210 137 241 136 248 157 C 257 181 222 208 195 220',C.rust);c.restore()}}
 else if(n===11){if(b.paragraph===1||b.paragraph===0)chariot(c,299,408,1.31);else if(b.paragraph===2){person(c,163,465,1,'speaker');c.save();c.translate(399,465);c.scale(-1,1);person(c,0,0,1,'king','calm',1);c.restore()}else{grain(c,173,289,2.5,false);grain(c,400,289,2.5,true);line(c,[[250,291],[320,291]],C.green,4);poly(c,[[320,291],[305,282],[305,300]],C.green);text(c,'GIVEN',171,396,24,C.ink,'TutorBold','center');text(c,'FOUND',400,396,24,C.ink,'TutorBold','center')}}
 else if(n===12){rr(c,93,87,395,348,27,C.white);text(c,String(b.question||'?'),290,253,133,C.green,'Poem','center');text(c,'THINK · SAY · CHECK',290,342,21,C.muted,'TutorBold','center')}
 else {person(c,169,460,.97,'speaker','calm',.8);c.save();c.translate(404,460);c.scale(-1,1);person(c,0,0,.97,'king','calm',1);c.restore();sparkle(c,286,345,.8,.7+.2*Math.sin(t));}
 if(b.mode==='think'){c.fillStyle='#203D3833';c.fillRect(0,0,580,536);rr(c,31,31,518,172,24,C.white);text(c,'TAKE A MOMENT',64,75,23,C.green,'TutorBold');const prompt=n===5?'Who expected to receive a gift?':n===7?'Which words suggest hesitation?':n===9?'Why is he sad after finding gold?':'Say your answer aloud.';block(c,prompt,64,123,390,27,36,C.muted);}
 c.restore();
}
function poem(c,scene,span){
 const x=108,max=1043;let size=50;let rows=[];
 function layout(){c.font=`${size}px Poem`;let row=[],width=0,offset=0;rows=[];for(const w of scene.poem.split(' ')){const ww=c.measureText(w).width,sw=c.measureText(' ').width;if(width+ww>max&&row.length){rows.push(row);row=[];width=0}row.push({word:w,x:width,w:ww,start:offset,end:offset+w.length});width+=ww+sw;offset+=w.length+1}if(row.length)rows.push(row)}
 layout();while(rows.length>7){size-=2;layout()}
 const lh=size*1.48,top=310+(7-rows.length)*12;
 for(let i=0;i<rows.length;i++)for(const item of rows[i]){const y=top+i*lh;if(span&&item.end>span[0]&&item.start<span[1])rr(c,x+item.x-5,y-size-4,item.w+11,size+16,9,C.glow);text(c,item.word,x+item.x,y,size,C.ink,'Poem')}
 text(c,'Rabindranath Tagore',109,818,25,C.muted,'PoemItalic');
}
function info(c,title,body){text(c,title,1262,824,28,C.green,'TutorBold');block(c,body,1262,861,568,25,32,C.muted)}
const qs=['','Where did the chariot stop? Who came down?','What is a “kingly jest”? Why was the speaker confused?','Why was he both surprised and sorrowful?'];
const answers=['','Where the speaker stood. The king came down with a smile.','A royal joke. He expected a gift, but was asked to give.','He found gold — and regretted giving so little.'];
function concept(c,kicker,headline,body,extra=''){
 pill(c,kicker.toUpperCase(),106,224,C.glow,C.green,23);
 const h=block(c,headline,106,340,1045,66,84,C.green,'Poem');
 const bh=block(c,body,108,378+h,995,37,52,C.ink);
 if(extra)block(c,extra,109,416+h+bh,990,27,40,C.muted,'PoemItalic');
}
function mainText(c,b,scene){
 const n=b.scene,f=focus(b,scene);
 if(n>=2&&n<=9){pill(c,b.mode==='read'?'READ THE POEM':b.mode==='think'?'YOUR TURN':'TUTOR EXPLAINS',106,205,b.mode==='read'?C.green:C.glow,b.mode==='read'?C.white:C.green,22);text(c,`PASSAGE ${n-1} OF 8`,1155,232,22,C.muted,'TutorBold','right');poem(c,scene,f.span);if(f.quote)info(c,f.quote,f.def);else info(c,...moods[n]);return}
 if(n===1){
  if(b.paragraph>=3){concept(c,'A reading key','Old words, familiar meanings','thou / thee  =  you\nthy  =  your');text(c,'Listen for these words as we read.',109,699,30,C.muted)}
  else if(b.paragraph===2){concept(c,'Meet the speaker','Who is telling the story?','The “I” is the character’s voice: a man who survives by asking for help.','The speaker and the poet are not necessarily the same person.')}
  else {pill(c,'CLASS 6 · POETRY',107,224,C.glow,C.green);text(c,'A Little Grain',103,383,94,C.green,'Poem');text(c,'of Gold',103,494,94,C.green,'Poem');text(c,'Rabindranath Tagore',109,569,34,C.rust,'PoemItalic');block(c,'Read closely. Picture the story. Discover its meaning.',109,705,900,37,53,C.muted)}
  info(c,'Read · Understand · Reflect','An illustrated poetry lesson');return;
 }
 if(n===10){
  if(b.paragraph<=0)concept(c,'Parable','A small story.\nA deeper lesson.','A simple story that teaches a moral or spiritual lesson.');
  else if(b.paragraph===1)concept(c,'A spiritual reading','The “king of all kings”','The king can represent God. His request invites generosity and trust.','This is the poem’s symbolic meaning.');
  else if(b.paragraph===2)concept(c,'Symbol','Something small can carry a big idea.','The grain: what we offer.\nThe gold: the precious value of giving.');
  else if(b.paragraph===3)concept(c,'The central message','Kindness is not a bargain.','Give sincerely, without expecting a material reward.');
  else concept(c,'In everyday life','Generosity takes many forms.','Share your time.\nHelp someone learn.\nOffer something you can spare.');
  info(c,'Look beneath the story','What matters is the willingness to give.');return;
 }
 if(n===11){
  const p=b.paragraph;
  if(p===1)concept(c,'Simile','“like a gorgeous dream”','The chariot is compared to a beautiful dream using “like”.','Effect: it helps us imagine the speaker’s wonder.');
  else if(p===2)concept(c,'Irony','The king asks the beggar.','The expected giver becomes the person asking for a gift.','Effect: the reversal surprises us and makes us think.');
  else if(p===3)concept(c,'Repetition','“least little grain”','The same words connect the small gift with the small piece of gold.','Effect: we understand why the speaker regrets holding back.');
  else if(p===4)concept(c,'The title','Small in size.\nLarge in meaning.','A little grain of gold leads to a discovery about giving.');
  else concept(c,'Poetic choices','How does Tagore help us understand?','Look for comparison, surprise, and repeated words.');
  info(c,'Notice the words','Use the poem as evidence for your ideas.');return;
 }
 if(n===12){
  if(!b.question)concept(c,'Your turn','Check your understanding','Say your answer aloud, or pause the video for more thinking time.');
  else {const q=b.question;const isAnswer=(q===1?b.paragraph>=2:q===2?b.paragraph>=4:b.paragraph>=6);pill(c,`QUESTION ${q} OF 3`,108,226,C.glow,C.green);const h=block(c,qs[q],106,340,1010,58,77,C.green,'Poem');if(isAnswer&&b.mode!=='think'){pill(c,'CHECK YOUR ANSWER',108,402+h,C.green,C.white,20);block(c,answers[q],109,514+h,1000,36,51,C.ink);}else {text(c,'Think about the words in the poem.',109,430+h,31,C.muted)}}
  info(c,b.mode==='think'?'Thinking time':'Explain + give evidence',b.mode==='think'?'You can pause the video for longer.':'Support your answer with a phrase from the poem.');return;
 }
 if(n===13){pill(c,'THE SPEAKER’S JOURNEY',108,226,C.glow,C.green);const labels=['Hope','Confusion','Reluctance','Surprise','Regret'];for(let i=0;i<labels.length;i++){const y=322+i*70;ellipse(c,126,y-10,15,15,i===4?C.gold:'#D9E2D4');text(c,String(i+1),126,y-3,18,C.green,'TutorBold','center');text(c,labels[i],164,y,37,C.green,i===4?'TutorBold':'Tutor');if(i<4)line(c,[[126,y+12],[126,y+37]],C.line,3)}text(c,'Give with a willing heart.',108,786,48,C.rust,'PoemItalic');info(c,'Carry it into your day','One kind act. No reward expected.');}
}
function staticLayer(b){
 const c=createCanvas(W,H),ctx=c.getContext('2d'),scene=plan.scenes[b.scene-1];
 ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);
 // Quiet editorial frame and generous separation between text and illustration.
 line(ctx,[[79,151],[1840,151]],C.line,2);
 pill(ctx,String(b.scene).padStart(2,'0'),80,66,C.green,C.white,22);
 text(ctx,scene.title,157,98,37,C.green,'TutorBold');
 text(ctx,'A LITTLE GRAIN OF GOLD',1838,68,23,C.muted,'TutorBold','right');
 text(ctx,'Rabindranath Tagore · Class 6',1838,108,22,C.muted,'Tutor','right');
 line(ctx,[[1209,214],[1209,866]],C.line,2);
 mainText(ctx,b,scene);
 rr(ctx,64,922,1792,111,22,C.ink);
 return c;
}
function findCaption(t,beat){return plan.captions?.find(c=>c.beat===beat&&t>=c.start&&t<c.end)}
function drawFrame(canvas,b,t,layer){const c=canvas.getContext('2d');c.drawImage(layer,0,0);const scene=plan.scenes[b.scene-1];sceneArt(c,b,scene,t);if(b.mode==='think'){const remaining=Math.max(1,Math.ceil(b.end-t));text(c,String(remaining),1775,342,48,C.green,'TutorBold','center');}
 const cap=findCaption(t,b.id);
 if(cap){const rows=wrap(c,cap.text,1650,34);if(rows.length>2)throw new Error('Caption overflow: '+cap.text);const y=rows.length===1?990:969;for(let i=0;i<rows.length;i++)text(c,rows[i],960,y+i*41,34,C.white,'Tutor','center')}
 else if(b.mode==='think')text(c,'Take a moment to think. You can pause for longer.',960,991,32,'#F3E5C5','Tutor','center');
 else if(b.mode==='read'||b.mode==='hold')text(c,'Let the words settle.',960,991,29,'#CFDCD0','Tutor','center');
 else if(b.mode==='end')text(c,'A Little Grain of Gold · Rabindranath Tagore',960,991,29,'#CFDCD0','Tutor','center');
 const progress=plan.duration?t/plan.duration:(b.scene-1)/13;c.fillStyle=C.gold;c.fillRect(64,1054,1792*progress,5);
 text(c,'READ',78,894,17,b.scene<10?C.green:C.muted,'TutorBold');text(c,'UNDERSTAND',144,894,17,b.scene===10||b.scene===11?C.green:C.muted,'TutorBold');text(c,'REFLECT',280,894,17,b.scene>=12?C.green:C.muted,'TutorBold');
 text(c,`${b.scene} / 13`,1835,894,19,C.muted,'Tutor','right');
}
async function main(){
 fs.mkdirSync(OUT,{recursive:true});
 const mode=process.argv[2]||'stills',canvas=createCanvas(W,H);
 if(mode==='stills'){
  const samples=[];
  for(let n=1;n<=13;n++){
   let b=plan.beats.find(b=>b.scene===n&&(n>=2&&n<=9?b.mode==='read'&&b.phrase===1:b.mode==='explain'&&b.paragraph===(n===10?2:n===11?1:n===12?4:0)));
   if(!b)b=plan.beats.find(b=>b.scene===n&&b.text);
   let t=b.start?b.start+.5:20;drawFrame(canvas,b,t,staticLayer(b));
   const file=path.join(WORK,`scene-${String(n).padStart(2,'0')}.png`);fs.writeFileSync(file,canvas.toBuffer('image/png'));samples.push(file);
  }
  console.log(JSON.stringify(samples));return;
 }
 if(!plan.duration)throw new Error('Run audio assembly first');
 const ff=spawn('ffmpeg',['-hide_banner','-loglevel','warning','-y','-f','rawvideo','-pixel_format','rgba','-video_size',`${W}x${H}`,'-framerate',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(WORK,'picture.mp4')],{stdio:['pipe','ignore','pipe']});
 ff.stderr.on('data',d=>process.stderr.write(d));let error;ff.on('error',e=>error=e);
 let bi=0,last=-1,layer;
 const limit=mode==='preview'?Math.min(plan.duration,85):plan.duration;
 const frames=Math.ceil(limit*FPS),start=Date.now();
 for(let i=0;i<frames;i++){
  const t=i/FPS;while(bi+1<plan.beats.length&&t>=plan.beats[bi].end)bi++;
  const b=plan.beats[bi];if(last!==b.id){layer=staticLayer(b);last=b.id}
  drawFrame(canvas,b,t,layer);
  if(!ff.stdin.write(canvas.data()))await once(ff.stdin,'drain');
  if(error)throw error;
  if(i%(FPS*30)===0)console.log(`Rendered ${Math.floor(t)} / ${Math.ceil(limit)} seconds · ${(i/Math.max(1,(Date.now()-start)/1000)).toFixed(0)} fps`);
 }
 ff.stdin.end();const [code]=await once(ff,'close');if(code)throw new Error('ffmpeg exit '+code);console.log('Video picture complete');
}
main().catch(e=>{console.error(e);process.exit(1)});
