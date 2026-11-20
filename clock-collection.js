/* Zegarowe przygody 6.0: album uratowanych bohaterów i naklejek, ranking odkrywców. */
(function(global){
'use strict';
const KEY='zegarowe-przygody-album-v1:';
function storageKey(player){return KEY+encodeURIComponent(String(player||'Gracz').trim().toLocaleLowerCase('pl-PL'));}
function read(player){
 try{
  const v=JSON.parse(localStorage.getItem(storageKey(player))||'{}');
  const clean=x=>Array.isArray(x)?[...new Set(x.filter(n=>Number.isInteger(n)&&n>=0&&n<10000))]:[];
  return {mini:clean(v.mini),big:clean(v.big)};
 }catch(e){return {mini:[],big:[]};}
}
function save(player,data){
 try{localStorage.setItem(storageKey(player),JSON.stringify(data));return true;}catch(e){return false;}
}
function addMini(player,index){if(!Number.isInteger(index)||index<0)return;const d=read(player);if(!d.mini.includes(index)){d.mini.push(index);save(player,d);}}
function addBig(player,index){if(!Number.isInteger(index)||index<0)return;const d=read(player);if(!d.big.includes(index)){d.big.push(index);save(player,d);}}
function create(tag,cls,txt){const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el;}
function button(label,click,css){const b=create('button',css||'album-tab',label);b.type='button';b.addEventListener('click',click);return b;}
function renderAlbum(container,player,worlds,bigRewards,miniRewards){
 const d=read(player),progress=worlds.read(player);
 const heroes=worlds.worlds.filter((w,i)=>worlds.passed(progress,i,3)).length;
 const groups=[
  {key:'heroes',label:'🦸 Uratowane postacie',length:worlds.worlds.length},
  {key:'big',label:'🏆 Wielkie naklejki',length:bigRewards.length},
  {key:'mini',label:'🐒 Zabawne naklejki',length:miniRewards.length}
 ];
 let active='heroes',page=0;
 container.replaceChildren();
 const head=create('div','album-header');
 head.append(create('div','album-kicker','📖 TWOJA KSIĘGA SKARBÓW'));
 head.append(create('h2','', 'Album odkrywcy: '+player));
 head.append(create('p','', 'Ratuj postacie w krainach i zbieraj naklejki za dobre odpowiedzi. Każde odkrycie zostaje w tej książce!'));
 head.append(create('div','album-totals','🦸 '+heroes+'/'+worlds.worlds.length+' postaci  ·  🏆 '+d.big.filter(i=>i<bigRewards.length).length+'/'+bigRewards.length+' dużych  ·  🐒 '+d.mini.filter(i=>i<miniRewards.length).length+'/'+miniRewards.length+' zabawnych'));
 container.append(head);
 const nav=create('div','album-tabs'),pageRoot=create('div','album-page'),pager=create('div','album-pages');
 container.append(nav,pageRoot,pager);
 const tabs=[];
 groups.forEach(g=>{
  const b=button(g.label,()=>{active=g.key;page=0;draw();},'album-tab');nav.append(b);tabs.push([g.key,b]);
 });
 function draw(){
  tabs.forEach(([key,b])=>b.setAttribute('aria-pressed',String(key===active)));
  const group=groups.find(g=>g.key===active),perPage=active==='mini'?16:16;
  const totalPages=Math.max(1,Math.ceil(group.length/perPage));
  page=Math.max(0,Math.min(page,totalPages-1));
  pageRoot.replaceChildren();pager.replaceChildren();
  const title=create('div','album-page-title');
  title.append(create('h3','',group.label));
  const unlocked=active==='heroes'?heroes:active==='big'?d.big.filter(n=>n<bigRewards.length).length:d.mini.filter(n=>n<miniRewards.length).length;
  title.append(create('span','',unlocked+' z '+group.length+' odkrytych'));
  pageRoot.append(title);
  const grid=create('div','album-grid');
  for(let i=page*perPage;i<Math.min(group.length,(page+1)*perPage);i++){
   const hero=active==='heroes',item=hero?worlds.worlds[i]:active==='big'?bigRewards[i]:miniRewards[i];
   const found=hero?worlds.passed(progress,i,3):active==='big'?d.big.includes(i):d.mini.includes(i);
   const stamp=create('div','album-sticker'+(found?' unlocked':' locked'));
   stamp.append(create('div','album-sticker-emoji',found?(hero?item.hero.trim().split(' ')[0]:active==='big'?item.emoji:item[0]):'❔'));
   const text=found?(hero?item.hero:active==='big'?item.name:item[1]):hero?worlds.worlds[i].name:'Naklejka do odkrycia';
   stamp.append(create('div','album-sticker-name',text));
   stamp.append(create('div','album-sticker-index',found?'⭐ Odkryta':hero?'🔒 Ukończ Wielki Test':'🔒 Zdobądź w grze'));
   grid.append(stamp);
  }
  pageRoot.append(grid);
  const go=button('← Poprzednia strona',()=>{page--;draw();},'album-pager-btn');
  go.disabled=page===0;
  const next=button('Następna strona →',()=>{page++;draw();},'album-pager-btn');
  next.disabled=page===totalPages-1;
  pager.append(go,create('span','', 'Strona '+(page+1)+' z '+totalPages),next);
 }
 draw();
 container.append(create('p','album-footer','Nowy album zapisuje konkretne naklejki od wersji 6.0. Starsze naklejki nie były przechowywane imiennie, dlatego nie można ich automatycznie odtworzyć. Uratowane wcześniej postacie są rozpoznawane z zapisanych postępów.'));
}
function renderRanking(container,player,results,worlds){
 container.replaceChildren();
 const head=create('div','leaderboard-intro');
 head.append(create('h2','','🏆 Ranking odkrywców'));
 head.append(create('p','','Kto uratował najwięcej bohaterów? Liczymy kolejno: uratowane postacie, ukończone etapy, gwiazdki, a na końcu najlepszy wynik punktowy.'));
 container.append(head);
 const seen=new Map();
 for(const row of results){
  if(typeof row.player!=='string'||!row.player.trim())continue;
  const key=row.player.trim().toLocaleLowerCase('pl-PL');
  const old=seen.get(key)||{player:row.player.trim(),bestPoints:0};
  old.bestPoints=Math.max(old.bestPoints,Number(row.points)||0);seen.set(key,old);
 }
 const normalized=String(player||'Gracz').trim().toLocaleLowerCase('pl-PL');
 if(!seen.has(normalized))seen.set(normalized,{player:String(player||'Gracz'),bestPoints:0});
 const ranks=[...seen.values()].map(p=>{
  const stats=worlds.stats(worlds.read(p.player));
  return {...p,...stats};
 }).sort((a,b)=>b.heroes-a.heroes||b.stages-a.stages||b.stars-a.stars||b.bestPoints-a.bestPoints||a.player.localeCompare(b.player,'pl'));
 const table=create('div','leaderboard-list');
 ranks.forEach((p,i)=>{
  const row=create('div','leaderboard-row'+(p.player.toLocaleLowerCase('pl-PL')===normalized?' myself':''));
  row.append(create('div','leaderboard-place',i===0?'🥇':i===1?'🥈':i===2?'🥉':String(i+1)+'.'));
  const name=create('div','leaderboard-player');
  name.append(create('strong','',p.player));
  name.append(create('small','',p.stages+'/64 etapów · ⭐ '+p.stars+' gwiazdek'));
  row.append(name,create('div','leaderboard-score','🦸 '+p.heroes+'/16'));
  table.append(row);
 });
 container.append(table);
 container.append(create('p','leaderboard-foot','Ranking jest lokalny — porównuje profile używane na tym samym urządzeniu. Nie synchronizuje wyników pomiędzy tabletami.'));
}
global.ClockCollection={read,addMini,addBig,renderAlbum,renderRanking};
})(window);