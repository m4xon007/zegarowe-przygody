/* Zegarowe przygody 6.1: interaktywna plansza, 16 krain, zachowanie starego postępu */
(function(global){
'use strict';
const base=global.ClockWorlds;
if(!base)throw Error('Brak modułu krain');
const extra=[
{id:'cukierki',name:'Cukierkowa Wyspa',icon:'🍭',hero:'🍬 Księżniczka Landrynka',intro:'Pokonaj słodkie łamigłówki i uwolnij Landrynkę!',level:3,color:'#ffe4f1',accent:'#cf6796'},
{id:'podwodne',name:'Podwodne Królestwo',icon:'🧜‍♀️',hero:'🐬 Delfin Bryś',intro:'Odszukaj zagubionego delfina w oceanie czasu!',level:3,color:'#d9f9fb',accent:'#2c919d'},
{id:'cyrk',name:'Cyrk Szalonych Zegarów',icon:'🎪',hero:'🦁 Lew Leon',intro:'Pokonaj podstępne sztuczki cyrkowego zegara!',level:3,color:'#fff0d3',accent:'#cf8d36'},
{id:'dino',name:'Dolina Dinozaurów',icon:'🦖',hero:'🦕 Dino Dyzio',intro:'Wyrusz w prehistoryczną wyprawę ratunkową!',level:3,color:'#e2f6d5',accent:'#6ca23f'},
{id:'piraci',name:'Piracka Wyspa',icon:'🏴‍☠️',hero:'🦜 Papuga Piratka',intro:'Rozszyfruj mapę piratów i odzyskaj papugę!',level:3,color:'#e5e8ff',accent:'#625cb0'},
{id:'noc',name:'Nocna Kraina',icon:'🌙',hero:'🦇 Nietoperz Błysk',intro:'Odmierz podróż przez północ i uratuj Błyska!',level:3,color:'#dae0ff',accent:'#5d69af'},
{id:'magia',name:'Akademia Magii',icon:'🧙‍♀️',hero:'🧚 Wróżka Iskierka',intro:'Rozwiąż zaklęcia czasu i uwolnij Iskierkę!',level:3,color:'#f0dffc',accent:'#9b64b9'},
{id:'final',name:'Zamek Mistrzyni Czasu',icon:'👑',hero:'🦄 Tęczowa Strażniczka',intro:'Ostatni finał! Uwolnij Strażniczkę Czasu!',level:3,color:'#ffe7c8',accent:'#d39b42'}
];
const initialIds=base.worlds.map(w=>w.id);
if(initialIds.length!==8||!extra.every(w=>!initialIds.includes(w.id)))throw Error('Niespójna lista poprzednich krain');
base.worlds.push(...extra);
const groups=[
{name:'Świat 1 · Pierwsza wyprawa',icon:'🌿',color:'#e5f6df'},
{name:'Świat 2 · Zamki i gwiazdy',icon:'🏰',color:'#e5e5ff'},
{name:'Świat 3 · Nieznane przygody',icon:'🏴‍☠️',color:'#fff0d8'},
{name:'Świat 4 · Legenda czasu',icon:'👑',color:'#fae4f5'}
];
const rand=n=>Math.floor(Math.random()*n);
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=rand(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
const previousPlan=base.plan;
base.plan=function(world,stage,player,clock){
 // Boss na końcu każdego z czterech światów: trudniejsza mieszanka zadań logicznych.
 if(world%4===3&&stage===3){
   const level=base.worlds[world].level,logic=clock.forLevel(level);
   const progress=clock.readProgress(player,level);
   const list=['read','set','calc','words','life',...logic,'detective','rescue','schedule','repair'];
   const pool=['calc','life','words',...logic,'detective','rescue','schedule'];
   while(list.length<25){
     const weighted=[];
     for(const kind of pool){
       const weight=Math.min(11,2+Math.round(clock.weakness(progress[kind])*10));
       for(let i=0;i<weight;i++)weighted.push(kind);
     }
     list.push(weighted[rand(weighted.length)]);
   }
   return shuffle(list.slice(0,25));
 }
 if(world<8)return previousPlan(world,stage,player,clock);
 const logic=clock.forLevel(3),progress=clock.readProgress(player,3);
 const priority=world>=12?['midnight','mystery','detective','duel','schedule','rescue','ontime','repair']:['detective','rescue','schedule','duel','ontime','repair','mystery','midnight'];
 let result=[];
 if(stage===0)result=['read','set','calc','words','life',...logic];
 else if(stage===1)result=['calc','calc','life','words','duel','schedule','rescue','ontime',...logic];
 else if(stage===2)result=['mystery','duel','repair','schedule','detective','midnight',...logic];
 else result=['read','set','calc','words','life',...logic];
 const candidates=stage===0?['read','set','calc','words','life',...priority]:stage===1?['calc','life','words',...priority]:priority;
 while(result.length<25){
  const weighted=[];
  for(const k of candidates){
   const error=clock.weakness(progress[k]);
   const weight=Math.min(10,1+Math.round(error*10)+(world>=12&&(k==='midnight'||k==='mystery')?2:0));
   for(let n=0;n<weight;n++)weighted.push(k);
  }
  result.push(weighted[rand(weighted.length)]);
 }
 return shuffle(result.slice(0,25));
};
function elem(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function btn(txt,cb,disabled,cls){
 const b=elem('button',cls||'',txt);b.type='button';b.disabled=!!disabled;
 if(!disabled&&typeof cb==='function')b.addEventListener('click',cb);return b;
}
function svg(tag,attrs){
 const s=document.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [k,v] of Object.entries(attrs||{}))s.setAttribute(k,String(v));
 return s;
}
function positions(cols,rows){
 return Array.from({length:base.worlds.length},(_,i)=>{
  const row=Math.floor(i/cols),col=i%cols,visualCol=row%2?cols-1-col:col;
  return {x:(visualCol+.5)/cols*100,y:(row+.5)/rows*100};
 });
}
function makeRoute(coords,viewWidth,viewHeight,cls,completed){
 const shell=svg('svg',{class:cls,viewBox:'0 0 '+viewWidth+' '+viewHeight,preserveAspectRatio:'none','aria-hidden':'true'});
 const pathAll=coords.map((p,i)=>(i?'L':'M')+(p.x*viewWidth/100).toFixed(1)+' '+(p.y*viewHeight/100).toFixed(1)).join(' ');
 shell.append(svg('path',{d:pathAll,class:'board-route-base'}));
 if(completed>0){
  const good=coords.slice(0,Math.min(coords.length,completed+1));
  shell.append(svg('path',{d:good.map((p,i)=>(i?'L':'M')+(p.x*viewWidth/100).toFixed(1)+' '+(p.y*viewHeight/100).toFixed(1)).join(' '),class:'board-route-done'}));
 }
 return shell;
}
function heroStats(data){
 const stages=base.worlds.reduce((n,w,i)=>n+base.stages.filter((_,s)=>base.passed(data,i,s)).length,0);
 const heroes=base.worlds.reduce((n,w,i)=>n+(base.passed(data,i,3)?1:0),0);
 const stars=base.worlds.reduce((n,w,i)=>n+base.stages.reduce((acc,stage,s)=>{
  const best=Number(data.best[w.id+':'+s])||0;
  return acc+(best===25?3:best>=23?2:best>=20?1:0);
 },0),0);
 return {stages,heroes,stars};
}
base.stats=heroStats;
base.groups=groups;
base.render=function(root,player,onStart){
 const data=base.read(player),next=base.nextQuest(player),stat=heroStats(data);
 const ready=i=>base.unlocked(data,i);
 let selected=next.world,selectedView;
 root.replaceChildren();
 const intro=elem('section','board-header');
 intro.append(elem('div','board-eyebrow','🎲 ZEGAROWE PRZYGODY · GRA PLANSZOWA'));
 intro.append(elem('h2','',next.complete?'👑 Mistrzyni Czasu!':'🗺️ Szlak 16 Krain'));
 intro.append(elem('p','',next.complete?'Uratowałaś wszystkich bohaterów! Wybierz dowolną krainę i zbieraj więcej gwiazdek.':'Podróżuj po planszy, zbieraj gwiazdki i ratuj 16 bohaterów. Za pierwsze uratowanie postaci: +10 min na tablecie, za ostatecznego bossa: +1 godzina! Nagrody przyznają rodzice.'));
 intro.append(elem('div','board-totals','🏆 Postacie '+stat.heroes+'/16  ·  ⭐ Gwiazdki '+stat.stars+'/192  ·  🏁 Etapy '+stat.stages+'/64'));
 const outer=elem('div','board-progress'),inside=elem('span');
 inside.style.width=stat.stages/64*100+'%';outer.append(inside);intro.append(outer);
 if(!next.complete){
  intro.append(btn('▶️ Kontynuuj: '+base.worlds[next.world].name+' · '+(next.stage===3?'Wielki Test':'Etap '+(next.stage+1)),()=>onStart(next.world,next.stage),false,'board-continue'));
 }
 root.append(intro);
 const board=elem('div','board-canvas');
 groups.forEach((g,j)=>{
  const bg=elem('div','board-zone');bg.style.top=j*25+'%';bg.style.height='25%';bg.style.background=g.color;
  const tag=elem('span','board-zone-label',g.icon+' '+g.name);bg.append(tag);board.append(bg);
 });
 const doneIndex=base.worlds.reduce((n,w,i)=>base.passed(data,i,3)?n+1:n,0);
 board.append(makeRoute(positions(4,4),1000,850,'board-road-desktop',doneIndex));
 board.append(makeRoute(positions(2,8),500,1700,'board-road-mobile',doneIndex));
 let nodeElements=[];
 const desktop=positions(4,4),mobile=positions(2,8);
 base.worlds.forEach((w,i)=>{
  const available=ready(i),completed=base.passed(data,i,3),current=next.world===i&&!next.complete;
  const classes='board-node'+(completed?' is-complete':available?' is-open':' is-locked')+(current?' is-current':'');
  const b=btn('',()=>choose(i),false,classes);
  b.setAttribute('aria-label','Kraina '+(i+1)+': '+w.name+', '+(completed?'uratowana':available?'dostępna':'zablokowana'));
  b.style.setProperty('--board-x',desktop[i].x+'%');b.style.setProperty('--board-y',desktop[i].y+'%');
  b.style.setProperty('--board-mobile-x',mobile[i].x+'%');b.style.setProperty('--board-mobile-y',mobile[i].y+'%');
  b.append(elem('span','board-emoji',available?w.icon:'🔒'));
  b.append(elem('span','board-number',String(i+1)));
  b.append(elem('span','board-node-title',w.name));
  if(completed)b.append(elem('span','board-node-marker','✅'));
  else if(current)b.append(elem('span','board-node-marker','📍'));
  else if(i%4===3)b.append(elem('span','board-node-marker','🏰'));
  board.append(b);nodeElements.push(b);
 });
 root.append(board);
 selectedView=elem('section','board-selected');root.append(selectedView);
 function choose(i){
  selected=i;
  nodeElements.forEach((el,j)=>el.classList.toggle('is-selected',j===i));
  const w=base.worlds[i],open=ready(i),saved=base.passed(data,i,3);
  selectedView.replaceChildren();
  selectedView.style.setProperty('--land-color',w.color);
  selectedView.append(elem('div','board-selected-icon',w.icon));
  const content=elem('div','board-selected-content');
  content.append(elem('div','board-selected-kicker','KRAINA '+(i+1)+' Z 16 · '+groups[Math.floor(i/4)].name));
  content.append(elem('h3','',w.name));
  content.append(elem('p','',open?w.intro:'🔒 Zdobądź Wielki Test poprzedniej krainy, aby odkryć tę krainę.'));
  content.append(elem('div','board-selected-hero',saved?'🏆 Uratowano: '+w.hero:'🆘 Do uratowania: '+w.hero));
  const stageButtons=elem('div','board-selected-stages');
  base.stages.forEach((label,s)=>{
   const done=base.passed(data,i,s),unlocked=open&&(s===0||base.passed(data,i,s-1));
   const best=Number(data.best[w.id+':'+s])||0,stars=best>=25?'⭐⭐⭐':best>=23?'⭐⭐':best>=20?'⭐':'';
   const b=btn((done?'✅ ':unlocked?'▶️ ':'🔒 ')+(s===3&&i%4===3?'👑 Wielki Boss':s===3?'Wielki Test':'Etap '+(s+1))+(stars?' '+stars:''),()=>onStart(i,s),!unlocked,'board-stage-button'+(done?' completed':unlocked?' available':''));
   b.title=label+' · minimum '+(s===3?'23':'20')+'/25';stageButtons.append(b);
  });
  content.append(stageButtons);selectedView.append(content);
 }
 choose(selected);
 root.append(elem('p','board-caption','Dotknij pola na planszy, aby zobaczyć etapy. Zaliczenie: etap 20/25, Wielki Test 23/25. Zdobyte postacie i wyniki zapisują się w profilu na tym urządzeniu.'));
};
})(window);