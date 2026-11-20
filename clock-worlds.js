/* Zegarowe przygody 5.0: mapa krain, etapy i ratowanie postaci */
(function(global){
'use strict';
const KEY='zegarowe-przygody-worlds-v1:';
const STAGES=['Rozgrzewka','Przygoda','Wyzwanie','Wielki Test'];
const WORLDS=[
{id:'polana',name:'Polana Chichotów',icon:'🌼',hero:'🐰 Królik Kiki',intro:'Uwolnij Królika Kiki z tajemniczej mgły!',level:1,color:'#e7f9dd',accent:'#54994e'},
{id:'zatoka',name:'Zatoka Vaiany',icon:'🌊',hero:'🐢 Żółwik Tiki',intro:'Pomóż Vaianie odnaleźć żółwika na wyspie!',level:1,color:'#d5f5fc',accent:'#148ca4'},
{id:'lodowa',name:'Lodowa Dolina',icon:'❄️',hero:'☃️ Bałwan Bąbel',intro:'Uratuj Bałwanka Bąbla z lodowej pułapki!',level:2,color:'#e2eeff',accent:'#5179c2'},
{id:'dzungla',name:'Dżungla Figli',icon:'🌴',hero:'🐒 Małpka Fikuś',intro:'Odnajdź małpkę w dżungli zagadek!',level:2,color:'#e2f5d4',accent:'#3e9052'},
{id:'zamek',name:'Zamek Tajemnic',icon:'🏰',hero:'🦉 Sowa Mądralinka',intro:'Odkryj sekrety zamku i uwolnij Sowę!',level:2,color:'#eee4ff',accent:'#7658af'},
{id:'kosmos',name:'Kosmiczna Planeta',icon:'🚀',hero:'🤖 Robot Piksel',intro:'Policz czas podróży, aby ocalić Robota!',level:3,color:'#d9efff',accent:'#4069b9'},
{id:'smok',name:'Smocza Góra',icon:'🐉',hero:'🐲 Smok Płomyk',intro:'Zdobądź szczyt góry i uwolnij smoka!',level:3,color:'#ffe2d6',accent:'#c3703b'},
{id:'gwiazdy',name:'Królestwo Gwiazd',icon:'🌟',hero:'🦄 Jednorożec Tęczak',intro:'Zdobądź gwiazdy i uratuj Jednorożca!',level:3,color:'#ffe4f1',accent:'#bb5f94'}
];
function key(name){return KEY+encodeURIComponent(String(name||'Gracz').trim().toLocaleLowerCase('pl-PL'));}
function read(name){try{const v=JSON.parse(localStorage.getItem(key(name))||'{}');if(!v||typeof v!=='object'||Array.isArray(v))return {cleared:{},best:{},attempts:0};return {cleared:v.cleared&&typeof v.cleared==='object'?v.cleared:{},best:v.best&&typeof v.best==='object'?v.best:{},attempts:Number(v.attempts)||0};}catch(e){return {cleared:{},best:{},attempts:0};}}
function save(name,v){try{localStorage.setItem(key(name),JSON.stringify(v));return true;}catch(e){return false;}}
function passed(v,i,s){return !!(v.cleared[WORLDS[i].id]||[])[s];}
function unlocked(v,i){return i===0||passed(v,i-1,3);}
function nextStage(v,i){for(let s=0;s<4;s++)if(!passed(v,i,s))return s;return 3;}
function nextQuest(name){const v=read(name);for(let i=0;i<WORLDS.length;i++)if(unlocked(v,i)&&!passed(v,i,3))return {world:i,stage:nextStage(v,i),complete:false};return {world:7,stage:3,complete:true};}
function record(name,i,s,solved){const v=read(name),w=WORLDS[i],k=w.id+':'+s,pass=solved>=(s===3?23:20),was=passed(v,i,s);v.best[k]=Math.max(Number(v.best[k])||0,solved);v.attempts++;if(pass){if(!v.cleared[w.id])v.cleared[w.id]=[false,false,false,false];v.cleared[w.id][s]=true;}save(name,v);return {success:pass,firstTime:pass&&!was,heroUnlocked:pass&&s===3&&!was,min:s===3?23:20,next:nextQuest(name)};}
const rand=n=>Math.floor(Math.random()*n);
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=rand(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
function plan(i,s,name,extra){
 const level=WORLDS[i].level,logic=extra.forLevel(level),all=['read','set','calc','words','life',...logic];let list=[];
 if(s===0)list=[...Array(9).fill('read'),...Array(10).fill('set'),...Array(6).fill('words')];
 else if(s===1)list=[...Array(8).fill('calc'),...Array(8).fill('life'),...Array(7).fill('words'),'read','set'];
 else if(s===2){list=[...logic];while(list.length<16)list.push(logic[rand(logic.length)]);list.push(...['read','set','calc','life','words','calc','life','read','set']);}
 else list=['read','read','set','set','calc','calc','words','words','life','life',...logic];
 const progress=extra.readProgress(name,level),pool=s===0?['read','set','words']:s===1?['calc','life','words','read','set']:s===2?[...logic,'calc','life','words']:all;
 function weighted(){const bag=[];for(const k of pool){const w=Math.min(8,1+Math.round(extra.weakness(progress[k])*9));for(let j=0;j<w;j++)bag.push(k);}return bag[rand(bag.length)];}
 while(list.length<25)list.push(weighted());
 return shuffle(list.slice(0,25));
}
function elem(tag,cls,label){const el=document.createElement(tag);if(cls)el.className=cls;if(label!==undefined)el.textContent=label;return el;}
function button(label,click,disabled){const b=elem('button','world-btn',label);b.type='button';b.disabled=!!disabled;if(!disabled)b.addEventListener('click',click);return b;}
function render(root,player,start){
 const data=read(player),next=nextQuest(player),completed=WORLDS.reduce((n,w,i)=>n+STAGES.filter((_,j)=>passed(data,i,j)).length,0);
 root.replaceChildren();const head=elem('div','world-map-intro');
 head.append(elem('h2','',next.complete?'🏆 Wszystkie krainy uratowane!':'🗺️ Twoja wielka przygoda'));
 head.append(elem('p','',next.complete?'Gratulacje! Wszystkie postacie są wolne. Wróć do ulubionej krainy i popraw swój rekord!':'Pokonaj 3 etapy i Wielki Test. Ratuj bohaterów i odblokowuj kolejne krainy!'));
 head.append(elem('div','world-global-progress','🌟 Zdobyte etapy: '+completed+'/32 · 🏆 Uratowane postacie: '+WORLDS.filter((_,i)=>passed(data,i,3)).length+'/8'));
 const bar=elem('div','world-global-bar'),fill=elem('span');fill.style.width=(completed/32*100)+'%';bar.append(fill);head.append(bar);
 if(!next.complete){const go=button('▶️ Graj dalej — '+WORLDS[next.world].name+' · '+STAGES[next.stage],()=>start(next.world,next.stage));go.classList.add('world-primary');head.append(go);}
 root.append(head);const cards=elem('div','world-cards');
 WORLDS.forEach((w,i)=>{
  const lock=!unlocked(data,i),done=passed(data,i,3),card=elem('article','world-card'+(lock?' world-locked':'')+(done?' world-complete':''));card.style.setProperty('--land-bg',w.color);card.style.setProperty('--land-accent',w.accent);
  card.append(elem('div','world-icon',w.icon));const desc=elem('div','world-card-desc');
  desc.append(elem('div','world-seq','KRAINA '+(i+1)+' / 8'));desc.append(elem('h3','',w.name));desc.append(elem('p','',lock?'🔒 Odblokujesz ją po Wielkim Teście poprzedniej krainy.':w.intro));
  desc.append(elem('div','world-hero',done?'🏆 Uratowano: '+w.hero:'🎁 Postać do uratowania: '+w.hero));
  const steps=elem('div','world-steps');STAGES.forEach((title,j)=>{
   const completed=passed(data,i,j),available=!lock&&(j===0||passed(data,i,j-1));const b=button((completed?'✅ ':available?'▶️ ':'🔒 ')+(j===3?'Wielki Test':'Etap '+(j+1)),()=>start(i,j),!available);
   if(completed)b.classList.add('world-step-done');if(available&&!completed)b.classList.add('world-step-next');b.title=title+' — minimum '+(j===3?'23':'20')+'/25';steps.append(b);
  });desc.append(steps);card.append(desc);cards.append(card);
 });root.append(cards);
 root.append(elem('p','world-footer-note','Etapy 1–3: zalicz 20/25. Wielki Test: 23/25. Masz dwie próby na zadanie. Możesz wracać do odblokowanych etapów. Każdy profil ma osobny postęp.'));
}
global.ClockWorlds={worlds:WORLDS,stages:STAGES,read,record,passed,unlocked,nextStage,nextQuest,plan,render};
})(window);