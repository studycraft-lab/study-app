/* Original vector artwork and readable lesson cards for the offline video. */
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require(process.env.CANVAS_MODULE || '@napi-rs/canvas');

const ROOT = path.resolve(__dirname, '..');
const WORK = process.env.LESSON_WORK || '/private/tmp/wild-duck-production';
const DATA = JSON.parse(fs.readFileSync(path.join(WORK, 'timeline.json'), 'utf8'));
const FRAMES = path.join(WORK, 'frames');
const W = 1920, H = 1080;
const C = { paper:'#F6F0E5', white:'#FFFDF7', ink:'#203B3A', muted:'#637570', forest:'#28574F', lake:'#5B909E', gold:'#EDBE65', amber:'#D28C63', line:'#D9DDD1', navy:'#233E50', pale:'#E9ECE0', coral:'#C77F71' };
const FONT_DIR = process.env.LESSON_FONT_DIR || '/System/Library/Fonts/Supplemental';
for (const [file, name] of [['Georgia.ttf','Story'],['Arial.ttf','Tutor'],['Arial Bold.ttf','TutorBold']])
  GlobalFonts.registerFromPath(path.join(FONT_DIR, file), name);

function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function ell(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function line(c,pts,color,width=3){c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke()}
function poly(c,pts,fill){c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=fill;c.fill()}
function txt(c,s,x,y,size,color=C.ink,font='Tutor',align='left'){c.font=`${size}px ${font}`;c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y)}
function wrap(c,s,width,size,font='Tutor'){c.font=`${size}px ${font}`;const out=[];for(const para of String(s).split('\n')){let row='';for(const word of para.split(/\s+/)){let test=row?row+' '+word:word;if(c.measureText(test).width>width&&row){out.push(row);row=word}else row=test}if(row)out.push(row)}return out}
function block(c,s,x,y,width,size,leading,color=C.ink,font='Tutor',max=10){const rows=wrap(c,s,width,size,font);if(rows.length>max)throw Error(`Text overflow (${rows.length}>${max}): ${s}`);rows.forEach((row,i)=>txt(c,row,x,y+i*leading,size,color,font));return rows.length*leading}
function pill(c,label,x,y,fill=C.forest,fg=C.white,size=22){c.font=`${size}px TutorBold`;const w=c.measureText(label).width+36;rounded(c,x,y,w,39,18,fill);txt(c,label,x+18,y+28,size,fg,'TutorBold');return w}
function bird(c,x,y,s=1,color=C.navy){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-22,3);c.quadraticCurveTo(-10,-9,0,0);c.quadraticCurveTo(10,-9,22,3);c.strokeStyle=color;c.lineWidth=3;c.lineCap='round';c.stroke();c.restore()}
function duck(c,x,y,s=1,injured=false){c.save();c.translate(x,y);c.scale(s,s);ell(c,0,0,62,38,'#D7BE8E',C.navy);ell(c,48,-27,26,28,'#E6D4A9',C.navy);ell(c,55,-35,3,3,C.navy);poly(c,[[72,-25],[104,-18],[73,-13]],'#D7945C');line(c,[[-55,12],[-89,2]],C.navy,3);c.save();c.translate(-4,-10);c.rotate(injured?.46:-.12);ell(c,0,0,37,21,injured?'#BDA784':'#C3A777',C.navy);line(c,[[-26,-7],[18,8]],'#90785E',2);c.restore();if(injured)line(c,[[-5,30],[-11,46]],'#E4E3D8',8);c.restore()}
function person(c,x,y,s=1,child=false,green=false){c.save();c.translate(x,y);c.scale(s,s);const skin='#B58768',coat=green?'#65856C':child?'#708BA2':'#706E62';ell(c,0,-85,22,26,skin);rounded(c,-23,-62,46,85,14,coat);line(c,[[-17,17],[-25,61]],'#4D5260',11);line(c,[[16,17],[25,61]],'#4D5260',11);line(c,[[-19,-46],[-43,-3]],skin,9);line(c,[[19,-46],[41,-5]],skin,9);c.beginPath();c.moveTo(-24,-101);c.quadraticCurveTo(3,-120,23,-99);c.strokeStyle='#39423F';c.lineWidth=14;c.stroke();c.restore()}
function lake(c,n){const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,n===10?'#D7A176':'#E0B98D');g.addColorStop(.46,'#E9CFA6');g.addColorStop(.47,'#94B9B7');g.addColorStop(1,'#4E7F8C');c.fillStyle=g;c.fillRect(0,0,640,650);ell(c,500,105,55,55,'#F4E1B6');poly(c,[[0,325],[129,236],[243,314],[399,224],[640,324],[640,386],[0,386]],'#A47E70');poly(c,[[42,343],[186,289],[279,343]],'#8A6F6C');for(let i=0;i<13;i++){const y=400+i*18;line(c,[[23+(i*37)%104,y],[210+(i*41)%315,y]],'#CDE1D3A9',2)} }
function flock(c,n){const count=n===2?29:n===3?18:12;for(let i=0;i<count;i++){const x=77+(i*83)%515,y=90+Math.floor(i/7)*34+(i%3)*10;bird(c,x,y,n===2?.82:.7,'#354E56')}}
function boat(c,withPeople=true){poly(c,[[83,508],[476,508],[427,584],[136,584]],'#76524A');line(c,[[83,508],[476,508]],'#D49A69',9);line(c,[[138,557],[421,557]],'#9C6B57',4);if(withPeople){person(c,237,497,.97,false,true);person(c,333,510,.77,true,false)}}
function reeds(c){for(const [x,h] of [[70,164],[102,185],[122,147],[517,151],[555,177],[583,137]]){line(c,[[x,650],[x-8,650-h]],'#547A61',5);ell(c,x-8,650-h,7,20,'#8A765E')}}
function sceneArt(c,scene){c.save();c.translate(1207,179);rounded(c,0,0,650,660,24,C.white);c.save();c.beginPath();c.roundRect(17,17,616,626,17);c.clip();c.translate(6,6);c.scale(616/640,626/650);const n=scene.number;
 if([1,2,3,4,5,9,10].includes(n)){lake(c,n);if(n<=3||n===9||n===10)flock(c,n);if(n<=3)boat(c);if(n===3){line(c,[[424,269],[458,323],[470,369]],'#E0E2D6',3);bird(c,466,368,.9,C.navy)}if(n===4||n===5){reeds(c);duck(c,346,464,1.58,true)}if(n===9){rounded(c,67,391,503,165,25,'#F3EEDFDD');const syms=['BOAT','FLOCK','DUCK','CARE','CHANGE'];syms.forEach((x,i)=>{ell(c,115+i*101,465,25,25,i<3?C.gold:C.forest);txt(c,String(i+1),115+i*101,474,21,i<3?C.ink:C.white,'TutorBold','center');txt(c,x,115+i*101,526,14,C.ink,'TutorBold','center')})}if(n===10){reeds(c);duck(c,382,478,1.3,true)}}
 else if(n===6){c.fillStyle='#DCE8D4';c.fillRect(0,0,640,650);rounded(c,0,437,640,213,0,'#A4BE91');rounded(c,385,135,230,310,10,'#E9D7B4');poly(c,[[362,137],[508,30],[643,137]],'#A9796F');person(c,204,430,1.4,true);duck(c,425,475,1.27,true);for(let i=0;i<6;i++)ell(c,40+i*99,563+(i%2)*25,16,7,'#84AA75')}
 else if(n===7){c.fillStyle='#E9DDD0';c.fillRect(0,0,640,650);rounded(c,0,451,640,199,0,'#C3AD97');rounded(c,30,95,228,311,16,'#C8D7CB');line(c,[[320,135],[580,135]],'#826A59',12);person(c,310,470,1.37,true);person(c,506,458,1.62,false,true);duck(c,397,537,.82,true);txt(c,'A choice can change.',320,91,31,C.forest,'Story','center')}
 else if(n===8){c.fillStyle='#E8EFE7';c.fillRect(0,0,640,650);const cards=[['SPELLBOUND','wonder'],['FORMATION','pattern'],['PLUMMETED','fell fast'],['BULRUSHES','reeds'],['MAIMED','injured'],['DEFIANTLY','firm choice']];cards.forEach(([a,b],i)=>{let x=36+(i%2)*300,y=48+Math.floor(i/2)*192;rounded(c,x,y,267,164,18,C.white,C.line);ell(c,x+37,y+43,21,21,i<3?C.gold:C.lake);txt(c,a,x+18,y+96,25,C.forest,'TutorBold');txt(c,b,x+18,y+136,24,C.muted)})}
 c.restore();c.restore();}
const focus={
 1:['THE SETTING','A father and son wait in a still boat.','They are there to shoot wild ducks.'],
 2:['THE WONDER','Teal bank and rise in formations.','Watching birds is the boy’s passion.'],
 3:['THE SHOT','The father misses the high flock.','The boy wounds one bird; the flock continues.'],
 4:['THE DISCOVERY','The bird’s wing is broken.','Touching it changes the boy’s feelings.'],
 5:['A TURNING POINT','The duck is alive.','The boy chooses to care for it.'],
 6:['CARE AT HOME','He bandages, feeds and watches the duck.','The injured bird can never fly again.'],
 7:['THE MISSING GUN','The boy throws away his gun.','The father feels relief and peace.'],
 8:['KEY WORDS','Use the words to describe what happened.','Say them aloud in your own sentence.'],
 9:['FIVE STORY STEPS','Still boat → flock → shot → care → choice','Tell the sequence in your own words.'],
 10:['WHAT TO REMEMBER','Wonder becomes compassion.','Use details from the story as evidence.'],
};
function mainCard(c,ev,scene){const kind=ev.kind;if(kind==='ask'||kind==='think'){pill(c,kind==='think'?'PAUSE AND SAY YOUR ANSWER':'YOUR TURN',94,208,C.gold,C.ink,24);block(c,scene.ask,94,329,1025,54,72,C.forest,'Story',4);if(kind==='think'){ell(c,1037,740,64,64,C.forest);txt(c,String(ev.count),1037,758,54,C.white,'TutorBold','center');txt(c,'Pause for longer if you need to.',96,750,30,C.muted)}else txt(c,'One question. Your own words.',96,747,30,C.muted);return}
 if(kind==='reveal'){pill(c,'CHECK YOUR ANSWER',94,208,C.forest,C.white,24);block(c,scene.reveal,94,332,1023,45,61,C.ink,'Story',6);txt(c,'The reason matters more than a perfect sentence.',96,749,28,C.muted);return}
 const f=focus[scene.number];pill(c,f[0],94,208,C.gold,C.ink,22);block(c,scene.title,91,329,1042,65,79,C.forest,'Story',2);line(c,[[94,388],[1109,388]],C.line,3);rounded(c,95,442,1018,112,18,C.pale);block(c,f[1],122,499,950,36,49,C.ink,'Tutor',2);rounded(c,95,577,1018,112,18,'#F2E9D8');block(c,f[2],122,635,950,36,49,C.ink,'Tutor',2);txt(c,'Romesh Gunesekera · Cordova English 6',96,765,27,C.muted,'Story');}
function caption(c,ev){rounded(c,69,864,1783,176,25,C.navy);const text=ev.kind==='think'?'Think, speak, and pause the video if you need more time.':ev.kind==='gap'?'':ev.text;if(!text)return;let size=34,rows=wrap(c,text,1668,size,'Tutor');while(rows.length>3&&size>27){size-=2;rows=wrap(c,text,1668,size,'Tutor')}if(rows.length>3)throw Error('Caption overflow: '+text);const lead=size+10,y=940-((rows.length-1)*lead)/2;rows.forEach((s,i)=>txt(c,s,960,y+i*lead,size,C.white,'Tutor','center'))}
function frame(ev,scene,index){const canvas=createCanvas(W,H),c=canvas.getContext('2d');c.fillStyle=C.paper;c.fillRect(0,0,W,H);rounded(c,0,0,W,142,0,C.white);pill(c,String(scene.number).padStart(2,'0'),69,49,C.forest,C.white,26);txt(c,'WILD DUCK',157,83,37,C.forest,'TutorBold');txt(c,scene.title,1844,82,28,C.muted,'Story','right');line(c,[[70,145],[1849,145]],C.line,2);mainCard(c,ev,scene);sceneArt(c,scene);caption(c,ev);c.fillStyle=C.gold;c.fillRect(70,1058,1780*Math.min(1,ev.start/DATA.duration),6);return canvas.toBuffer('image/png')}
function main(){fs.mkdirSync(FRAMES,{recursive:true});let last=null;const lines=['ffconcat version 1.0'];const manifest=[];for(let i=0;i<DATA.segments.length;i++){const ev=DATA.segments[i],scene=DATA.scenes[ev.scene-1];let file;if(ev.kind==='gap'&&last){file=last}else{file=path.join(FRAMES,`frame-${String(i).padStart(4,'0')}.png`);fs.writeFileSync(file,frame(ev,scene,i));last=file}lines.push(`file '${file.replaceAll("'","'\\''")}'`,`duration ${(ev.end-ev.start).toFixed(6)}`);manifest.push({index:i,scene:ev.scene,kind:ev.kind,file,duration:ev.end-ev.start})}lines.push(`file '${last}'`);fs.writeFileSync(path.join(WORK,'frames.ffconcat'),lines.join('\n')+'\n');fs.writeFileSync(path.join(WORK,'frame-manifest.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify({segments:DATA.segments.length,frames:fs.readdirSync(FRAMES).length,duration:DATA.duration}));}
main();
