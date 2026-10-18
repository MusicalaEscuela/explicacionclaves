/* Clave a clave · Musicala. Web educativa autónoma, sin librerías ni rastreadores. */
'use strict';

/* Las notas se cuentan en "pasos diatónicos": n = octava*7 + grado (Do 4 = 28). */
const CLEFS = {
  sol:   { name:'Sol', image:'assets/clave-sol.svg', anchor:2, base:30, refLine:2, zone:'agudo', color:'#CE0071' },
  fa:    { name:'Fa',  image:'assets/clave-fa.svg',  anchor:6, base:18, refLine:4, zone:'grave', color:'#0C41C4' },
  do:    { name:'Do',  image:'assets/clave-do.svg',  anchor:4, base:24, refLine:3, zone:'medio', color:'#5729FF' }
};
const ZONE_LABEL = { grave:'graves', medio:'medios', agudo:'agudos' };
const NAMES = ['DO','RE','MI','FA','SOL','LA','SI'];
const OFFSETS = [0,2,4,5,7,9,11];
const PIANO_FROM = 14, PIANO_TO = 42; // Do 2 a Do 6
const q = s => document.querySelector(s);
const qa = s => [...document.querySelectorAll(s)];

const noteFromN = n => { const octave=Math.floor(n/7), degree=((n%7)+7)%7; return { n, name:NAMES[degree], octave, degree, midi:12*(octave+1)+OFFSETS[degree] }; };
const pretty = note => `${note.name.charAt(0)}${note.name.slice(1).toLowerCase()} ${note.octave}`;
const midiToN = midi => { const oct=Math.floor(midi/12)-1; return oct*7+[0,0,1,1,2,3,3,4,4,5,5,6][midi%12]; };
const escapeAttr = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** Pentagrama con una o varias notas. positions: posiciones relativas a la 1.ª línea (0 = 1.ª línea). */
function staffSVG(clef, positions, opt={}){
  const o = { color:CLEFS[clef].color, ref:false, label:'', ...opt };
  positions = [].concat(positions);
  const c = CLEFS[clef];
  const yFor = i => 171 - i*12;
  const lo = Math.min(0,...positions), hi = Math.max(8,...positions);
  const top = Math.min(20, yFor(hi)-50), bottom = Math.max(230, yFor(lo)+40);
  const x1 = 30, step = positions.length>1 ? 64 : 0, startX = positions.length>1 ? 170 : 230;
  const x2 = Math.max(330, startX + step*(positions.length-1) + 70);
  const clefBox = { sol:{x:-2,y:14,w:82,h:207}, fa:{x:8,y:68,w:83,h:101}, do:{x:8,y:64,w:82,h:125} }[clef];
  let svg = '';
  for(let i=0;i<5;i++) svg += `<line class="staff-line" x1="${x1}" x2="${x2}" y1="${75+i*24}" y2="${75+i*24}"/>`;
  if(o.ref) svg += `<line class="staff-reference" style="stroke:${o.color}" x1="${x1}" x2="${x2}" y1="${yFor(c.anchor)}" y2="${yFor(c.anchor)}"/>`;
  svg += `<image href="${c.image}" x="${clefBox.x+x1-20}" y="${clefBox.y}" width="${clefBox.w}" height="${clefBox.h}"/>`;
  positions.forEach((p,i)=>{
    const cx = startX + i*step, y = yFor(p);
    for(let l=-2;l>=p;l-=2) svg += `<line class="staff-ledger" x1="${cx-24}" x2="${cx+24}" y1="${yFor(l)}" y2="${yFor(l)}"/>`;
    for(let l=10;l<=p;l+=2) svg += `<line class="staff-ledger" x1="${cx-24}" x2="${cx+24}" y1="${yFor(l)}" y2="${yFor(l)}"/>`;
    const stem = p<=4 ? `M ${cx+12} ${y-3} v -62` : `M ${cx-12} ${y+3} v 62`;
    svg += `<ellipse class="melody-note" data-i="${i}" cx="${cx}" cy="${y}" rx="14" ry="10" transform="rotate(-19 ${cx} ${y})" fill="${o.color}"/><path d="${stem}" stroke="${o.color}" stroke-width="3"/>`;
  });
  return `<svg class="staff-svg" viewBox="0 ${top} ${x2+20} ${bottom-top}" role="img" aria-label="${escapeAttr(o.label||('Pentagrama en clave de '+c.name))}">${svg}</svg>`;
}

/** Teclado de piano en SVG. bars: [{from,to,color,label}] en n diatónico; tint: {clefKey} pinta las teclas dentro de su ventana. */
function pianoSVG(opt={}){
  const o = { from:PIANO_FROM, to:PIANO_TO, bars:[], tint:[], marked:null, interactive:false, barRow:16, ...opt };
  const W = 24, H = 110, top = o.bars.length*o.barRow + (o.bars.length?6:0);
  let white='', black='', bars='';
  for(let n=o.from;n<=o.to;n++){
    const i=n-o.from, x=i*W, note=noteFromN(n);
    let fill='#fff';
    o.tint.forEach(k=>{ const c=CLEFS[k]; if(n>=c.base && n<=c.base+8) fill=c.color+'2e'; });
    const isMarked = o.marked===note.midi;
    const attrs = o.interactive ? ` tabindex="0" role="button" aria-label="${pretty(note)}" data-midi="${note.midi}"` : '';
    white += `<g class="key${o.interactive?' key-int':''}"${attrs}><rect x="${x}" y="${top}" width="${W}" height="${H}" rx="3" fill="${isMarked?'#220A63':fill}" stroke="#cfcbe0"/>${note.degree===0?`<text x="${x+W/2}" y="${top+H-9}" text-anchor="middle" class="key-label${isMarked?' on':''}${note.midi===60?' c4':''}">Do${note.octave}</text>`:''}</g>`;
    if([0,1,3,4,5].includes(note.degree) && n<o.to){
      const midi = note.midi+1;
      const bm = o.marked===midi;
      const battrs = o.interactive ? ` tabindex="0" role="button" aria-label="${pretty(note)} sostenido" data-midi="${midi}"` : '';
      black += `<g class="key key-black${o.interactive?' key-int':''}"${battrs}><rect x="${x+W-7}" y="${top}" width="14" height="${H*0.62}" rx="2" fill="${bm?'#CE0071':'#1b1730'}"/></g>`;
    }
  }
  o.bars.forEach((b,r)=>{
    const a=Math.max(b.from,o.from)-o.from, z=Math.min(b.to,o.to)-o.from;
    if(z<a) return;
    const y=r*o.barRow;
    bars += `<rect x="${a*W+2}" y="${y}" width="${(z-a+1)*W-4}" height="${o.barRow-5}" rx="${(o.barRow-5)/2}" fill="${b.color}"/>`;
    if(b.from<o.from) bars += `<text x="${a*W+6}" y="${y+o.barRow-8}" class="bar-arrow">◂</text>`;
    if(b.to>o.to) bars += `<text x="${(z+1)*W-14}" y="${y+o.barRow-8}" class="bar-arrow">▸</text>`;
    if(b.label) bars += `<text x="${a*W+((z-a+1)*W)/2}" y="${y+o.barRow-8}" text-anchor="middle" class="bar-label">${escapeAttr(b.label)}</text>`;
  });
  const width=(o.to-o.from+1)*W;
  return `<svg class="piano-svg" viewBox="0 0 ${width} ${top+H+2}" role="img" aria-label="Teclado de piano de Do 2 a Do 6">${bars}${white}${black}</svg>`;
}
const clefBar = (k, label=true) => ({ from:CLEFS[k].base, to:CLEFS[k].base+8, color:CLEFS[k].color, label:label?`Clave de ${CLEFS[k].name}`:'' });

/* ---------- Audio sintetizado ---------- */
let audioContext=null;
function playNote(midi, when=0, dur=.9){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return false;
    if(!audioContext) audioContext=new Ctx();
    if(audioContext.state==='suspended') audioContext.resume();
    const start=audioContext.currentTime+0.015+when, freq=440*Math.pow(2,(midi-69)/12);
    const gain=audioContext.createGain();
    gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(.2,start+.03);
    gain.gain.exponentialRampToValueAtTime(.0001,start+dur);
    gain.connect(audioContext.destination);
    [[1,1],[2,.25],[3,.08]].forEach(([m,v])=>{
      const osc=audioContext.createOscillator(), g=audioContext.createGain();
      osc.type='sine'; osc.frequency.value=freq*m; g.gain.value=v;
      osc.connect(g); g.connect(gain); osc.start(start); osc.stop(start+dur+.05);
    });
    return true;
  }catch(err){ console.warn('No se pudo reproducir el sonido:',err); return false; }
}

/* ---------- Hero ---------- */
q('#heroPiano').innerHTML = pianoSVG({ bars:[clefBar('fa',false),clefBar('do',false),clefBar('sol',false)], tint:['fa','do','sol'], barRow:12 });

/* ---------- 01 · El problema ---------- */
const MELODY = [16,18,21,23,21,18,16]; // Mi2 Sol2 Do3 Mi3 Do3 Sol2 Mi2
let problemClef='sol';
function renderProblem(){
  const c=CLEFS[problemClef], pos=MELODY.map(n=>n-c.base);
  const ledgers = Math.max(...pos.map(p=>p<0?Math.floor(-p/2):p>8?Math.floor((p-8)/2):0));
  q('#problemStaff').innerHTML = staffSVG(problemClef,pos,{label:`Melodía grave escrita en clave de ${c.name}`});
  q('#problemText').innerHTML = problemClef==='sol'
    ? `<strong>Clave de Sol: hasta ${ledgers} líneas adicionales en una sola nota.</strong> Las notas se caen del pentagrama porque esta ventana está pensada para sonidos agudos. Se puede escribir… pero leerlo es un rompecabezas.`
    : `<strong>Clave de Fa: ${ledgers?'solo '+ledgers+' línea adicional':'ninguna línea adicional'}.</strong> Los mismos sonidos, ahora dentro del pentagrama. La clave de Fa pone la ventana en la zona grave.`;
  qa('[data-problem-clef]').forEach(b=>{const on=b.dataset.problemClef===problemClef;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
qa('[data-problem-clef]').forEach(b=>b.addEventListener('click',()=>{problemClef=b.dataset.problemClef;renderProblem();}));
q('#playMelody').addEventListener('click',()=>{
  MELODY.forEach((n,i)=>{
    playNote(noteFromN(n).midi,i*.42,.6);
    setTimeout(()=>{ const el=q(`#problemStaff .melody-note[data-i="${i}"]`); if(el){el.classList.add('playing');setTimeout(()=>el.classList.remove('playing'),380);} }, i*420);
  });
});
renderProblem();

/* ---------- 02 · Mapa del sonido ---------- */
let mapClef='sol', mapMidi=60;
function bestClefsFor(midi){
  const n=midiToN(midi);
  const inside=Object.keys(CLEFS).filter(k=>n>=CLEFS[k].base && n<=CLEFS[k].base+8);
  const near=Object.keys(CLEFS).filter(k=>!inside.includes(k) && n>=CLEFS[k].base-4 && n<=CLEFS[k].base+12);
  return {inside,near};
}
function renderMap(){
  const keys = mapClef==='all' ? ['fa','do','sol'] : [mapClef];
  q('#mapPiano').innerHTML = pianoSVG({ bars:keys.map(k=>clefBar(k)), tint:keys, marked:mapMidi, interactive:true, barRow:20 });
  qa('[data-map-clef]').forEach(b=>{const on=b.dataset.mapClef===mapClef;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  qa('#mapPiano .key-int').forEach(k=>{
    const go=()=>{ mapMidi=Number(k.dataset.midi); playNote(mapMidi); renderMap(); const again=q(`#mapPiano [data-midi="${mapMidi}"]`); if(again) again.focus({preventScroll:true}); };
    k.addEventListener('click',go);
    k.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();go();} });
  });
  const n=midiToN(mapMidi), note=noteFromN(n), sharp=mapMidi!==note.midi;
  q('#mapNote').textContent = `${note.name}${sharp?'♯':''} ${note.octave}`;
  const {inside,near}=bestClefsFor(mapMidi);
  const names = ks => ks.map(k=>`<strong style="color:${CLEFS[k].color}">clave de ${CLEFS[k].name}</strong>`).join(' y ');
  let advice;
  if(inside.length) advice = `Cabe dentro de las 5 líneas en ${names(inside)}.` + (near.length?` En ${names(near)} necesita líneas adicionales.`:'');
  else if(near.length) advice = `Se sale un poco de todas las ventanas: en ${names(near)} se lee con algunas líneas adicionales.`;
  else advice = n<CLEFS.fa.base ? 'Muy grave: incluso en clave de Fa necesita varias líneas adicionales.' : 'Muy agudo: incluso en clave de Sol necesita varias líneas adicionales.';
  if(mapMidi===60) advice += ' Es el <strong>Do central</strong>: la frontera entre graves y agudos.';
  q('#mapAdvice').innerHTML = advice;
  const show = inside[0] || near[0] || (n<CLEFS.fa.base?'fa':'sol');
  q('#mapStaff').innerHTML = staffSVG(show, n-CLEFS[show].base, {label:`${pretty(note)} en clave de ${CLEFS[show].name}`});
}
qa('[data-map-clef]').forEach(b=>b.addEventListener('click',()=>{mapClef=b.dataset.mapClef;renderMap();}));
renderMap();

/* ---------- 03 · Claves ---------- */
qa('.static-staff').forEach(el=>{ el.innerHTML=staffSVG(el.dataset.clef,Number(el.dataset.note),{ref:true}); });
qa('.compare-staff').forEach(el=>{ el.innerHTML=staffSVG(el.dataset.clef,Number(el.dataset.note),{color:'#220A63'}); });
q('#listenMiddleC').addEventListener('click',()=>playNote(60));

/* ---------- 04 · Instrumentos (rangos aproximados en sonido real) ---------- */
const INSTRUMENTS = [
  { name:'Contrabajo',   icon:'🎻', low:28, high:55, clefs:['fa'], note:'Se escribe una octava más aguda de lo que suena.' },
  { name:'Tuba',         icon:'📯', low:29, high:58, clefs:['fa'] },
  { name:'Violonchelo',  icon:'🎻', low:36, high:76, clefs:['fa','do','sol'], note:'Fa casi siempre; Do (4.ª) y Sol en sus notas agudas.' },
  { name:'Fagot',        icon:'🪈', low:34, high:75, clefs:['fa','do'], note:'Fa, y Do en 4.ª línea para lo agudo.' },
  { name:'Trombón',      icon:'🎺', low:40, high:72, clefs:['fa','do'], note:'Fa, y Do en 4.ª línea para lo agudo.' },
  { name:'Voz grave',    icon:'🎤', low:40, high:65, clefs:['fa'], note:'Bajos y barítonos.' },
  { name:'Viola',        icon:'🎻', low:48, high:81, clefs:['do'], note:'Clave de Do en 3.ª: justo el centro.' },
  { name:'Guitarra',     icon:'🎸', low:40, high:83, clefs:['sol'], note:'Se escribe en Sol una octava más aguda de lo que suena.' },
  { name:'Trompeta',     icon:'🎺', low:54, high:82, clefs:['sol'] },
  { name:'Voz aguda',    icon:'🎤', low:60, high:81, clefs:['sol'], note:'Sopranos y contraltos (y tenores, con un 8 bajo la clave).' },
  { name:'Violín',       icon:'🎻', low:55, high:96, clefs:['sol'] },
  { name:'Flauta',       icon:'🪈', low:60, high:96, clefs:['sol'] },
  { name:'Piano',        icon:'🎹', low:21, high:108, clefs:['sol','fa'], note:'Dos claves a la vez: el gran pentagrama.' }
];
const RANGE_FROM=7, RANGE_TO=49; // Do 1 a Do 7
const pct = n => ((Math.min(Math.max(n,RANGE_FROM),RANGE_TO)-RANGE_FROM)/(RANGE_TO-RANGE_FROM)*100).toFixed(2);
const glyph = k => k==='do'?'𝄡':k==='fa'?'𝄢':'𝄞';
const ticks = [1,2,3,4,5,6,7].map(o=>`<span class="tick${o===4?' tick-c4':''}" style="left:${pct(o*7)}%">Do${o}</span>`).join('');
q('#instrumentList').innerHTML = `<div class="range-axis" aria-hidden="true"><div></div><div class="range-track">${ticks}</div></div>` + INSTRUMENTS.map(ins=>{
  const cols = ins.clefs.map(k=>CLEFS[k].color);
  const bg = cols.length>1 ? `linear-gradient(90deg,${[...cols].sort((x,y)=>['#0C41C4','#5729FF','#CE0071'].indexOf(x)-['#0C41C4','#5729FF','#CE0071'].indexOf(y)).join(',')})` : cols[0];
  const tags = ins.clefs.map(k=>`<span class="clef-pill" style="--c:${CLEFS[k].color}">${glyph(k)} ${CLEFS[k].name}</span>`).join('');
  const lo=midiToN(ins.low), hi=midiToN(ins.high);
  return `<div class="range-row"><div class="range-name"><span class="instrument-icon" aria-hidden="true">${ins.icon}</span><div><h3>${ins.name}</h3>${ins.note?`<small>${ins.note}</small>`:''}</div><div class="instrument-tags">${tags}</div></div><div class="range-track" role="img" aria-label="${ins.name}: de ${pretty(noteFromN(lo))} a ${pretty(noteFromN(hi))}"><span class="c4-line" style="left:${pct(28)}%"></span><span class="range-bar" style="left:${pct(lo)}%;width:${pct(hi)-pct(lo)}%;background:${bg}"></span></div></div>`;
}).join('');

/* ---------- 05 · Reto: ¿qué clave le queda mejor? ---------- */
const TOTAL=8;
let quiz=[], qi=0, score=0, answered=false;
const sections={ intro:q('#quizIntro'), play:q('#quizPlay'), end:q('#quizEnd') };
const show = id => Object.entries(sections).forEach(([k,el])=>el.hidden=k!==id);
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const rand = (a,b) => a+Math.floor(Math.random()*(b-a+1));
function buildQuiz(){
  const pool = INSTRUMENTS.filter(i=>i.name!=='Piano' && i.name!=='Guitarra' && i.name!=='Violonchelo');
  const ins = shuffle(pool).slice(0,5).map(i=>({ type:'ins', ins:i, answer:i.clefs[0] }));
  const notes = [
    { type:'note', n:rand(14,19), answer:'fa' },
    { type:'note', n:rand(27,29), answer:'do' },
    { type:'note', n:rand(34,39), answer:'sol' }
  ];
  return shuffle([...ins,...notes]);
}
function openQuestion(){
  answered=false;
  const cur=quiz[qi];
  q('#quizCounter').textContent=`Pregunta ${qi+1} de ${TOTAL}`;
  q('#quizScore').textContent=`${score} ${score===1?'acierto':'aciertos'}`;
  q('#quizProgress').style.width=`${qi/TOTAL*100}%`;
  q('#quizFeedback').textContent=''; q('#nextQuestion').hidden=true;
  qa('.answer-option').forEach(b=>{b.disabled=false;b.classList.remove('correct','incorrect');});
  if(cur.type==='ins'){
    q('#quizQuestion').textContent=`¿En qué clave se escribe normalmente: ${cur.ins.name}?`;
    q('#quizVisual').innerHTML=`<div class="quiz-ins"><span aria-hidden="true">${cur.ins.icon}</span><strong>${cur.ins.name}</strong></div>${pianoSVG({bars:[{from:midiToN(cur.ins.low),to:midiToN(cur.ins.high),color:'#220A63'}],barRow:14})}<p class="quiz-hint">La barra muestra dónde suena.</p>`;
  }else{
    const note=noteFromN(cur.n);
    q('#quizQuestion').textContent='Escucha este sonido. ¿Qué clave lo escribe más cómodo?';
    q('#quizVisual').innerHTML=`${pianoSVG({marked:note.midi})}<button type="button" class="sound-button" id="quizListen">♫ Escuchar</button>`;
    q('#quizListen').addEventListener('click',()=>playNote(note.midi));
    playNote(note.midi);
  }
}
function answer(btn){
  if(answered) return; answered=true;
  const cur=quiz[qi], ok=btn.dataset.answer===cur.answer;
  if(ok) score++;
  qa('.answer-option').forEach(b=>{ b.disabled=true; if(b.dataset.answer===cur.answer) b.classList.add('correct'); else if(b===btn) b.classList.add('incorrect'); });
  const c=CLEFS[cur.answer];
  const why = cur.type==='ins'
    ? `${cur.ins.name} suena en la zona de los ${ZONE_LABEL[c.zone]}, así que lee en clave de ${c.name}.${cur.ins.note?' '+cur.ins.note:''}`
    : `Ese ${pretty(noteFromN(cur.n))} está en la zona de los ${ZONE_LABEL[c.zone]}: en clave de ${c.name} cae dentro o muy cerca de las 5 líneas.`;
  q('#quizFeedback').innerHTML=`<strong>${ok?'¡Exacto!':'Casi.'}</strong> ${why}`;
  q('#quizScore').textContent=`${score} ${score===1?'acierto':'aciertos'}`;
  q('#nextQuestion').hidden=false;
  q('#nextQuestion').textContent=qi===TOTAL-1?'Ver resultado':'Siguiente';
}
qa('.answer-option').forEach(b=>b.addEventListener('click',()=>answer(b)));
const bestKey='clave-a-clave.registros.best';
const getBest=()=>{try{const v=localStorage.getItem(bestKey);return v===null?null:Number(v);}catch(_){return null;}};
const displayBest=()=>{const b=getBest();q('#bestResult').textContent=b===null?'':`Tu mejor resultado: ${b} de ${TOTAL}`;};
q('#startQuiz').addEventListener('click',()=>{quiz=buildQuiz();qi=0;score=0;show('play');openQuestion();});
q('#nextQuestion').addEventListener('click',()=>{
  if(!answered) return;
  qi++;
  if(qi<TOTAL){openQuestion();return;}
  try{const b=getBest(); if(b===null||score>b) localStorage.setItem(bestKey,String(score));}catch(_){}
  show('end');
  q('#quizEndTitle').textContent = score===TOTAL?'¡Lo tienes clarísimo!':score>=6?'¡Muy bien!':'Vas entendiendo la idea';
  q('#quizEndText').textContent = score>=6?'Ya sabes por qué existen varias claves: cada una enfoca una zona del sonido.':'Recuerda: graves → Fa, medios → Do, agudos → Sol. Vuelve al mapa del sonido y prueba de nuevo.';
  q('#finalScore').innerHTML=`${score} <span>/ ${TOTAL}</span>`;
});
q('#retryQuiz').addEventListener('click',()=>{show('intro');displayBest();});
show('intro'); displayBest();

/* ---------- Menú móvil ---------- */
q('#menuToggle').addEventListener('click',()=>{
  const menu=q('#mobileMenu'), open=menu.hidden;
  menu.hidden=!open;
  q('#menuToggle').setAttribute('aria-expanded',String(open));
  q('#menuToggle').setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
});
qa('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>{q('#mobileMenu').hidden=true;q('#menuToggle').setAttribute('aria-expanded','false');}));
