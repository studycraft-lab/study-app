/* Original diagrams and lesson cards; no textbook page images are reproduced. */
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require(process.env.CANVAS_MODULE || '@napi-rs/canvas');

const ROOT = path.resolve(__dirname, '..');
const WORK = process.env.LESSON_WORK || '/private/tmp/early-vedic-production';
const OUT = process.env.LESSON_OUT || path.resolve(ROOT, '../../output/video/early-vedic-civilization');
const DATA = JSON.parse(fs.readFileSync(path.join(WORK, 'timeline.json'), 'utf8'));
const FRAMES = path.join(WORK, 'frames');
const W = 1920, H = 1080;
const C = { bg:'#F4F0E5', white:'#FFFEFA', ink:'#193643', muted:'#526771', navy:'#183B51', teal:'#1B6D72', turquoise:'#DAEEEB', gold:'#E9B957', amber:'#FFF0CE', coral:'#D8765F', blush:'#F7E4DF', line:'#CCD7D4', blue:'#70AFC9', green:'#68A98B' };
const FONT_DIR = process.env.LESSON_FONT_DIR || '/System/Library/Fonts/Supplemental';
GlobalFonts.registerFromPath(path.join(FONT_DIR, 'Arial.ttf'), 'Tutor');
GlobalFonts.registerFromPath(path.join(FONT_DIR, 'Arial Bold.ttf'), 'TutorBold');
GlobalFonts.registerFromPath(path.join(FONT_DIR, 'Georgia.ttf'), 'Story');

function rect(c,x,y,w,h,r,fill,stroke,width=2){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function line(c,x1,y1,x2,y2,color=C.line,width=3){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke()}
function arrow(c,x1,y1,x2,y2,color=C.teal,width=6){line(c,x1,y1,x2,y2,color,width);const angle=Math.atan2(y2-y1,x2-x1);c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-18*Math.cos(angle-.55),y2-18*Math.sin(angle-.55));c.lineTo(x2-18*Math.cos(angle+.55),y2-18*Math.sin(angle+.55));c.closePath();c.fillStyle=color;c.fill()}
function text(c,s,x,y,size=32,color=C.ink,font='Tutor',align='left'){c.font=`${size}px ${font}`;c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;c.fillText(s,x,y)}
function wrap(c,s,max,size,font='Tutor'){c.font=`${size}px ${font}`;const rows=[];for(const paragraph of String(s).split('\n')){let row='';for(const word of paragraph.split(/\s+/)){const tryRow=row?row+' '+word:word;if(c.measureText(tryRow).width>max&&row){rows.push(row);row=word}else row=tryRow}if(row)rows.push(row)}return rows}
function block(c,s,x,y,w,size=31,leading=42,color=C.ink,font='Tutor',maxRows=8){const rows=wrap(c,s,w,size,font);if(rows.length>maxRows)throw new Error(`Overflow: ${s}`);rows.forEach((row,i)=>text(c,row,x,y+i*leading,size,color,font));return rows.length*leading}
function pill(c,label,x,y,fill=C.teal,fg=C.white,size=24){c.font=`${size}px TutorBold`;const w=c.measureText(label).width+34;rect(c,x,y,w,42,18,fill);text(c,label,x+17,y+29,size,fg,'TutorBold');return w}
function smallCard(c,x,y,w,h,title,body,fill=C.white,accent=C.teal){rect(c,x,y,w,h,19,fill,C.line);rect(c,x,y,10,h,[19,0,0,19],accent);text(c,title,x+29,y+48,27,accent,'TutorBold');block(c,body,x+29,y+89,w-54,26,34,C.ink,'Tutor',4)}
function diagramBase(c,label){rect(c,788,170,1057,665,25,C.white,C.line);pill(c,label,825,201,C.navy,C.white,23)}

const FOCUS={
  overview:['A source gives clues','A map places events','A timeline shows change'],
  map:['Early: northwest','Later: farther east','Early → Later, over time'],
  sources:['Four Vedas','Passed on orally','Many works, different times'],
  government:['Family → grama → jana','Rajan and assemblies','Purohita and senani'],
  daily:['Family and food','Dress and recreation','Women’s experiences varied'],
  economy:['Cattle, farming and crafts','Four varnas in the textbook','Divisions changed over time'],
  beliefs:['Indra and Agni','Hymns and yajnas','Connect evidence to ideas'],
  recap:['Map and timeline','Community and daily life','Source and evidence']
};
function sidePanel(c,scene,ev){
  rect(c,70,170,680,665,25,C.white,C.line);
  pill(c,ev.kind==='ask'||ev.kind==='think'?'YOUR TURN':ev.kind==='reveal'?'CHECK':'NOTICE',105,205,ev.kind==='think'?C.gold:C.teal,ev.kind==='think'?C.ink:C.white,23);
  if(ev.kind==='ask'||ev.kind==='think'){
    block(c,scene.question,106,324,602,45,59,C.navy,'Story',6);
    if(ev.kind==='think'){
      rect(c,105,603,601,135,20,C.amber);
      text(c,'Think. Say your answer.',136,664,30,C.ink,'TutorBold');
      text(c,String(ev.count),655,699,63,C.teal,'TutorBold','right');
    }else text(c,'Pause longer if you need to.',106,753,28,C.muted);
    return;
  }
  if(ev.kind==='reveal'){
    block(c,scene.answer,106,325,600,43,58,C.navy,'Story',6);
    text(c,'The relationship matters most.',107,747,28,C.muted);
    return;
  }
  const focus=FOCUS[scene.visual];
  text(c,'Build the picture',106,302,40,C.navy,'Story');
  focus.forEach((item,i)=>{
    const active=ev.beat===i;
    rect(c,105,345+i*131,602,108,18,active?C.turquoise:C.bg,active?C.teal:C.line,active?3:1);
    rect(c,127,374+i*131,48,48,24,active?C.teal:C.line);
    text(c,String(i+1),151,408+i*131,27,active?C.white:C.ink,'TutorBold','center');
    block(c,item,195,412+i*131,485,29,38,active?C.navy:C.muted,active?'TutorBold':'Tutor',2);
  });
  text(c,'Class 6 History · source-grounded revision',106,788,23,C.muted);
}

function overview(c){diagramBase(c,'THREE QUESTIONS');
  const cards=[['WHERE?','Trace settlement on a map.','MAP',C.turquoise],['WHEN?','Put Early before Later.','TIME',C.amber],['HOW?','Read evidence about life.','SOURCE',C.blush]];
  cards.forEach(([title,body,tag,fill],i)=>{const x=825+i*332;rect(c,x,294,306,367,22,fill,C.line);rect(c,x+34,329,238,92,18,C.white);text(c,title,x+153,390,37,C.navy,'TutorBold','center');block(c,body,x+30,485,246,29,40,C.ink,'Tutor',3);pill(c,tag,x+30,587,C.teal,C.white,21)});
  text(c,'Map · timeline · village',1316,748,32,C.muted,'Story','center');
}
function map(c){diagramBase(c,'PLACE + TIME');
  rect(c,821,277,985,337,18,'#EBF2EA');
  // A deliberately labelled schematic: region relation, not geographic boundaries.
  for(let i=0;i<7;i++){const x=890+i*42;line(c,x,327,x-18,524,C.blue,5)}
  rect(c,856,355,321,164,22,C.turquoise,C.teal,3);
  text(c,'SAPTA SINDHU',1016,422,31,C.navy,'TutorBold','center');
  text(c,'northwest · seven rivers',1016,466,24,C.muted,'Tutor','center');
  arrow(c,1185,435,1412,435,C.coral,8);
  rect(c,1432,355,329,164,22,C.amber,C.coral,3);
  text(c,'GANGETIC PLAIN',1596,422,29,C.navy,'TutorBold','center');
  text(c,'farther east',1596,466,25,C.muted,'Tutor','center');
  text(c,'Schematic map · not to scale',856,580,22,C.muted);
  line(c,879,687,1738,687,C.line,7);
  rect(c,886,649,367,78,14,C.teal);rect(c,1373,649,367,78,14,C.gold);
  text(c,'EARLY · c. 1500–1000 BCE',1069,699,26,C.white,'TutorBold','center');
  text(c,'LATER · c. 1000–500 BCE',1556,699,26,C.ink,'TutorBold','center');
  arrow(c,1255,687,1364,687,C.coral,5);
}
function sources(c){diagramBase(c,'THE EVIDENCE');
  text(c,'THE FOUR VEDAS',844,315,29,C.navy,'TutorBold');
  const names=['RIG VEDA','SAMA VEDA','YAJUR VEDA','ATHARVA VEDA'];
  names.forEach((name,i)=>{const x=842+(i%2)*260,y=347+Math.floor(i/2)*115;rect(c,x,y,238,87,16,i===0?C.turquoise:C.bg,i===0?C.teal:C.line,i===0?3:2);text(c,name,x+119,y+54,24,C.navy,'TutorBold','center')});
  rect(c,1412,331,365,281,19,C.amber,C.line);
  text(c,'ORAL TRADITION',1595,394,27,C.navy,'TutorBold','center');
  ['learn','recite','teach'].forEach((word,i)=>{rect(c,1455+i*97,451,87,54,17,C.white,C.line);text(c,word,1498+i*97,486,20,C.ink,'TutorBold','center');if(i<2)arrow(c,1544+i*97,478,1550+i*97,478,C.coral,3)});
  text(c,'Rig Veda: a key source for this period',854,687,30,C.teal,'TutorBold');
  text(c,'A source offers clues; it cannot tell every life story.',854,741,27,C.muted);
}
function government(c){diagramBase(c,'COMMUNITY');
  const boxes=[['JANA','tribe','RAJAN'],['GRAMA','village','GRAMANI'],['FAMILY','household','GRIHAPATI']];
  boxes.forEach(([name,meaning,leader],i)=>{const y=293+i*135;rect(c,865,y,529,106,17,i===0?C.turquoise:C.bg,C.line);text(c,name,894,y+47,29,C.navy,'TutorBold');text(c,meaning,894,y+83,24,C.muted);pill(c,leader,1198,y+31,i===0?C.teal:C.navy,C.white,20);if(i<2)arrow(c,1129,y+110,1129,y+131,C.coral,4)});
  rect(c,1450,285,326,184,17,C.amber,C.line);text(c,'ASSEMBLIES',1477,335,25,C.navy,'TutorBold');text(c,'sabha · samiti',1477,383,30,C.teal,'TutorBold');text(c,'advise or check',1477,424,23,C.muted);
  rect(c,1450,491,326,236,17,C.blush,C.line);text(c,'OTHER ROLES',1477,541,25,C.navy,'TutorBold');text(c,'purohita',1477,589,28,C.teal,'TutorBold');text(c,'religious adviser',1477,622,22,C.muted);text(c,'senani',1477,668,28,C.teal,'TutorBold');text(c,'war leader',1477,701,22,C.muted);
}
function daily(c){diagramBase(c,'EVERYDAY LIFE');
  smallCard(c,829,294,445,188,'FAMILY','Joint families; grihapati led a household.',C.turquoise,C.teal);
  smallCard(c,1314,294,445,188,'FOOD','Wheat, barley, milk, fruit and vegetables.',C.amber,C.navy);
  smallCard(c,829,516,445,188,'RECREATION','Music, dancing, chariot racing and games.',C.bg,C.coral);
  smallCard(c,1314,516,445,188,'WOMEN','The textbook describes education and ritual roles for some women.',C.blush,C.teal);
  text(c,'Experiences varied across families and communities.',850,775,27,C.muted);
}
function economy(c){diagramBase(c,'WORK + GROUPS');
  text(c,'LIVELIHOODS',845,303,28,C.navy,'TutorBold');
  const jobs=['cattle','farming','weaving','pottery','metalwork','chariots'];
  jobs.forEach((job,i)=>{const x=846+(i%3)*158,y=339+Math.floor(i/3)*95;rect(c,x,y,143,75,17,i<2?C.turquoise:C.bg,C.line);text(c,job,x+71,y+48,22,C.navy,'TutorBold','center')});
  line(c,1383,297,1383,683,C.line,3);
  text(c,'FOUR VARNAS',1420,303,28,C.navy,'TutorBold');
  [['Brahmanas','learning and ritual'],['Kshatriyas','protection'],['Vaishyas','farming and trade'],['Shudras','labour and service']].forEach(([name,role],i)=>{const y=336+i*89;rect(c,1414,y,356,75,15,i%2?C.bg:C.amber,C.line);text(c,name,1435,y+31,23,C.teal,'TutorBold');text(c,role,1435,y+59,20,C.muted)});
  rect(c,844,701,924,84,15,C.blush);text(c,'Textbook outline: social divisions changed over time.',869,751,27,C.ink,'TutorBold');
}
function beliefs(c){diagramBase(c,'BELIEF + PRACTICE');
  rect(c,844,293,445,279,19,C.turquoise,C.line);text(c,'INDRA',872,357,35,C.navy,'TutorBold');text(c,'rain · thunder',872,411,28,C.teal);text(c,'Named in the hymns',872,479,26,C.ink);
  rect(c,1323,293,445,279,19,C.amber,C.line);text(c,'AGNI',1351,357,35,C.navy,'TutorBold');text(c,'fire',1351,411,28,C.teal);text(c,'Offerings in yajnas',1351,479,26,C.ink);
  arrow(c,1072,631,1539,631,C.coral,7);
  text(c,'hymns and offerings',1300,689,31,C.navy,'TutorBold','center');
  text(c,'A belief in the text is evidence of a belief, not every person.',1304,763,24,C.muted,'Tutor','center');
}
function recap(c){diagramBase(c,'REBUILD IT FROM MEMORY');
  const items=[['1','MAP','Sapta Sindhu → east'],['2','TIME','Early → Later'],['3','PEOPLE','family → grama → jana'],['4','SOURCE','Rig Veda → clues']];
  items.forEach(([num,title,desc],i)=>{const x=841+(i%2)*475,y=296+Math.floor(i/2)*207;rect(c,x,y,443,170,21,i===0?C.turquoise:i===1?C.amber:i===2?C.bg:C.blush,C.line);rect(c,x+23,y+25,58,58,29,C.teal);text(c,num,x+52,y+66,28,C.white,'TutorBold','center');text(c,title,x+101,y+67,30,C.navy,'TutorBold');text(c,desc,x+26,y+132,25,C.ink)});
  text(c,'Replay a section · then say it without looking',1300,772,27,C.muted,'Story','center');
}
const diagrams={overview,map,sources,government,daily,economy,beliefs,recap};
function caption(c,ev){rect(c,70,858,1775,172,23,C.navy);const message=ev.kind==='think'?'Think, then say your answer aloud. Pause if you need more time.':ev.kind==='gap'?'':ev.text;if(!message)return;let size=35;let rows=wrap(c,message,1640,size,'Tutor');while(rows.length>3&&size>26){size-=2;rows=wrap(c,message,1640,size,'Tutor')}if(rows.length>3)throw new Error(`Caption overflow: ${message}`);const step=size+10;const baseline=945-(rows.length-1)*step/2;rows.forEach((row,i)=>text(c,row,958,baseline+i*step,size,C.white,'Tutor','center'))}
function frame(ev,scene,sceneIndex){const canvas=createCanvas(W,H),c=canvas.getContext('2d');c.fillStyle=C.bg;c.fillRect(0,0,W,H);rect(c,0,0,W,133,0,C.white);rect(c,72,38,73,61,18,C.teal);text(c,String(sceneIndex+1).padStart(2,'0'),108,81,29,C.white,'TutorBold','center');text(c,'EARLY VEDIC CIVILIZATION',171,82,38,C.navy,'TutorBold');text(c,scene.title,1844,80,29,C.muted,'Story','right');line(c,70,133,1848,133,C.line,2);sidePanel(c,scene,ev);diagrams[scene.visual](c);caption(c,ev);c.fillStyle=C.gold;c.fillRect(70,1062,1775*Math.min(1,ev.start/DATA.duration),7);return canvas.toBuffer('image/png')}
function main(){fs.mkdirSync(FRAMES,{recursive:true});fs.mkdirSync(OUT,{recursive:true});const lines=['ffconcat version 1.0'];const manifest=[];let last=null;for(let i=0;i<DATA.events.length;i++){const ev=DATA.events[i],scene=DATA.scenes[ev.scene];let file;if(ev.kind==='gap'&&last){file=last}else{file=path.join(FRAMES,`frame-${String(i).padStart(4,'0')}.png`);fs.writeFileSync(file,frame(ev,scene,ev.scene));last=file}lines.push(`file '${file.replaceAll("'","'\\''")}'`,`duration ${(ev.end-ev.start).toFixed(6)}`);manifest.push({index:i,scene:ev.scene,kind:ev.kind,file,duration:ev.end-ev.start})}lines.push(`file '${last}'`);fs.writeFileSync(path.join(WORK,'frames.ffconcat'),lines.join('\n')+'\n');fs.writeFileSync(path.join(WORK,'frame-manifest.json'),JSON.stringify(manifest,null,2));fs.copyFileSync(path.join(FRAMES,'frame-0000.png'),path.join(OUT,'poster.png'));console.log(JSON.stringify({events:DATA.events.length,frames:fs.readdirSync(FRAMES).length,duration:DATA.duration}))}
main();
