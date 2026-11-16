/* Zegarowe przygody 4.4 – zagadki logiczne i adaptacyjny wybór zadań.
   Dane postępu przechowywane są osobno dla gracza i poziomu; wyniki v4 pozostają nietknięte. */
(function(global){
  'use strict';
  const MIN=60, DAY=1440;
  const rand=n=>Math.floor(Math.random()*n);
  const choose=a=>a[rand(a.length)];
  const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){let j=rand(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
  const wrap=n=>(n%DAY+DAY)%DAY;
  const display=n=>{n=wrap(n);return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  const levelMinutes=level=>level===1?[0,15,30,45]:level===2?Array.from({length:12},(_,i)=>i*5):Array.from({length:60},(_,i)=>i);
  const time=(level,hMin=7,hMax=19)=> (hMin+rand(hMax-hMin+1))*60+choose(levelMinutes(level));
  const duration=level=>choose(level===1?[15,30,45,60]:level===2?[10,15,20,25,30,35,40,45,60,75,90]:[7,12,15,18,20,25,30,35,40,45,50,60,75,90,120]);
  const minutePhrase=n=>n===15?'kwadrans':n===30?'pół godziny':n===45?'trzy kwadranse':`${n} minut`;
  const kinds={detective:'🕵️ Detektyw czasu',rescue:'🚀 Misja ratunkowa',schedule:'🗓️ Plan dnia',duel:'⏰ Pojedynek zegarów',ontime:'🚌 Czy zdążysz?',midnight:'🌙 Podróż przez północ',repair:'🔧 Zepsuty zegar',mystery:'🎯 Tajemnicza godzina'};
  const hints={detective:'Rozpoznawaj błędne odczyty godzin i nieprawdziwe obliczenia.',rescue:'Obliczaj godzinę wyjścia od terminu przybycia.',schedule:'Dodawaj kolejno dwa odcinki czasu.',duel:'Porównuj dwie tarcze i obliczaj różnicę w minutach.',ontime:'Policz, czy ktoś zdąży i ile minut zostanie.',midnight:'Ćwicz przekraczanie godziny 00:00.',repair:'Sprawdzaj ustawienie obu wskazówek i naprawiaj pomyłki.',mystery:'Łącz kilka wskazówek, aby znaleźć jedną godzinę.'};
  const allKinds=Object.keys(kinds);
  const forLevel=level=>level===1?['detective','rescue','schedule','ontime','repair'] : level===2?allKinds.filter(k=>k!=='midnight'):allKinds;
  const adaptiveKey=(name,level)=>`zegarowe-przygody-v44-learning:${encodeURIComponent(String(name||'Gracz').trim().toLocaleLowerCase('pl-PL'))}:${level}`;
  function readProgress(name,level){
    try{
      const val=JSON.parse(localStorage.getItem(adaptiveKey(name,level))||'{}');
      return val&&typeof val==='object'&&!Array.isArray(val)?val:{};
    }catch(e){return {};}
  }
  function noteProgress(name,level,category,outcome){
    if(!['first','second','failed'].includes(outcome))return;
    const all=readProgress(name,level),stat=all[category]&&typeof all[category]==='object'?all[category]:{first:0,second:0,failed:0};
    const safe={first:Math.max(0,Number(stat.first)||0),second:Math.max(0,Number(stat.second)||0),failed:Math.max(0,Number(stat.failed)||0)};
    safe[outcome]++;all[category]=safe;
    try{localStorage.setItem(adaptiveKey(name,level),JSON.stringify(all));}catch(e){}
  }
  function weakness(stat){
    if(!stat)return 0;
    const first=Number(stat.first)||0,second=Number(stat.second)||0,failed=Number(stat.failed)||0;
    const attempts=first+second+failed;
    if(!attempts)return 0;
    return (failed*3+second)/(attempts+4); // łagodzenie: 1 pomyłka nie zdominuje serii
  }
  const kindGroup=k=>k==='wordsChoice'||k==='wordsDigits'?'words':k;
  function weightPick(candidates,progress){
    let bag=[];
    for(const kind of candidates){
      const score=weakness(progress[kindGroup(kind)]);
      const weight=Math.min(9,1+Math.round(score*10));
      for(let i=0;i<weight;i++)bag.push(kind);
    }
    return choose(bag);
  }
  function buildPlan(mode,level,storyKind,player){
    if(mode==='special')return ['quest0','quest1','quest2','quest3','quest4'];
    if(mode==='detective')return Array(25).fill('detective');
    const logic=forLevel(level);
    if(mode==='story'&&storyKind==='logic'){
      const progress=readProgress(player,level);
      const arr=[...logic];
      while(arr.length<25)arr.push(weightPick(logic,progress));
      return shuffle(arr);
    }
    if(mode==='story'&&storyKind!=='mix')return Array(25).fill(storyKind);
    if(mode==='read'||mode==='set')return Array(25).fill(mode);
    const progress=readProgress(player,level);
    if(mode==='mission'){
      const plan=['read','read','set','set','calc','calc','words','words','life','life'];
      plan.push(...logic); // jeden przykład każdej dostępnej nowej kategorii
      while(plan.length<25){
        // Błędy zwiększają szansę na dodatkowe zadanie, ale nie wypierają całej różnorodności.
        plan.push(weightPick(['read','set','calc','words','life',...logic],progress));
      }
      return shuffle(plan);
    }
    if(mode==='story'){
      const plan=['calc','calc','calc','words','words','words','life','life','life',...logic];
      while(plan.length<25)plan.push(weightPick(['calc','words','life',...logic],progress));
      return shuffle(plan);
    }
    return Array(25).fill('calc');
  }
  const hero=(ctx)=>ctx.theme==='classic'?choose(['Zuzia','Ola','Tomek','Ania']):choose(['Vaiana','Stitch','Elsa','Olaf','Simba','Mirabel','Roszpunka']);
  function detective(level,ctx){
    const character=hero(ctx),start=time(level),d=duration(level);
    if(rand(2)===0){
      const changes=level===1?[15,30,60]:level===2?[5,10,15,30,60]:[3,7,12,15,30,60];
      const correct=rand(2)===0,claimed=wrap(start+(correct?d:d+choose(changes)));
      return {kind:'detective',category:'detective',answerType:'choice',answer:correct?'Tak':'Nie',choices:['Tak','Nie'],labels:['✅ Prawda','❌ Fałsz'],start,
        prompt:`🕵️ ${character} mówi: „Jest ${display(start)}. Za ${minutePhrase(d)} będzie ${display(claimed)}”.\nCzy ma rację?`,explanation:`${display(start)} + ${d} min = ${display(start+d)}.`};
    }
    const h=Math.floor(start/60),m=start%60,next=((h+1)%12)||12,current=(h%12)||12;
    const correct=rand(2)===0;
    // Określenia kwadrans po / wpół do / za kwadrans – pełne minuty są dobierane zgodnie z treścią.
    const target=choose([15,30,45]),clockH=h;
    const words=target===15?`kwadrans po ${current}`:target===30?`wpół do ${next}`:`za kwadrans ${next}`;
    const displayed=correct?target:(target+15)%60;
    return {kind:'detective',category:'detective',answerType:'choice',answer:correct?'Tak':'Nie',choices:['Tak','Nie'],labels:['✅ Prawda','❌ Fałsz'],start:clockH*60+displayed,
      prompt:`🕵️ ${character} twierdzi: „${display(clockH*60+displayed)} to ${words}”.\nPrawda czy fałsz?`,explanation:`Poprawna godzina to ${display(clockH*60+target)}.`};
  }
  function rescue(level,ctx){
    const name=hero(ctx),journey=duration(level),arrival=time(level,10,19);
    return {kind:'rescue',category:'rescue',answerType:'time',answer:wrap(arrival-journey),start:arrival,
      prompt:`🚀 ${name} musi dotrzeć na statek o ${display(arrival)}. Droga zajmuje ${minutePhrase(journey)}.\nO której najpóźniej trzeba wyruszyć?`,explanation:`${display(arrival)} − ${journey} min = ${display(arrival-journey)}.`};
  }
  function schedule(level,ctx){
    const name=hero(ctx),start=time(level,7,16),lesson=level===1?choose([30,45,60]):duration(level),pause=level===1?choose([15,30]):level===2?choose([5,10,15,20]):choose([7,12,15,25]);
    const finish=start+lesson+pause;
    return {kind:'schedule',category:'schedule',answerType:'time',answer:wrap(finish),start,
      prompt:`🗓️ ${name} zaczyna zajęcia o ${display(start)}. Zajęcia trwają ${minutePhrase(lesson)}, a potem jest ${minutePhrase(pause)} przerwy.\nO której zaczną się kolejne zajęcia?`,explanation:`${display(start)} + ${lesson} min + ${pause} min = ${display(finish)}.`};
  }
  function duel(level){
    const start=time(level,7,18),difference=level===2?choose([15,20,25,30,35,40,45,50,60,75]):choose([13,17,25,35,47,55,65,73,85]);
    const end=start+difference;
    return {kind:'duel',category:'duel',answerType:'minutes',answer:difference,start,
      visualClocks:[start,end],prompt:'⏰ Dwa zegary pokazują różne chwile. Ile minut minęło od pierwszego do drugiego?',
      explanation:`${display(start)} → ${display(end)} to ${difference} min.`};
  }
  function ontime(level,ctx){
    const name=hero(ctx),departure=time(level,9,19),travel=duration(level),slack=level===1?choose([10,15,20]):level===2?choose([5,10,15,20]):choose([3,7,12,17,22]);
    const willMake=rand(2)===0;
    const now=departure-travel+(willMake?-slack:slack);
    const correct=willMake?`Tak, zostanie ${slack} min`:`Nie, spóźni się ${slack} min`;
    const variants=[correct,willMake?`Nie, spóźni się ${slack} min`:`Tak, zostanie ${slack} min`,`Tak, zostanie ${slack+5} min`,`Nie, spóźni się ${slack+5} min`];
    return {kind:'ontime',category:'ontime',answerType:'choice',answer:correct,choices:shuffle(variants),start:now,
      prompt:`🚌 ${name} chce zdążyć na autobus o ${display(departure)}. Jest ${display(now)}, a droga trwa ${minutePhrase(travel)}.\nCzy zdąży i ile minut zostanie lub zabraknie?`,
      explanation:`${display(now)} + ${travel} min = ${display(now+travel)}. Autobus: ${display(departure)}.`};
  }
  function midnight(level,ctx){
    const name=hero(ctx),start=choose([22*60+45,23*60+10,23*60+20,23*60+35,23*60+50,23*60+55]),delta=choose([20,25,30,40,45,50,65,75,90].filter(d=>start+d>=DAY));
    return {kind:'midnight',category:'midnight',answerType:'time',answer:wrap(start+delta),start,
      prompt:`🌙 ${name} rozpoczyna nocną przygodę o ${display(start)}. Mija ${minutePhrase(delta)}.\nKtóra jest godzina następnego dnia?`,explanation:`${display(start)} + ${delta} min = ${display(start+delta)} następnego dnia.`};
  }
  function repair(level){
    const start=time(level,7,19),trueH=(Math.floor(start/60)%12)||12,trueM=start%60,wrongHand=choose(['hour','minute']);
    const offset=level===1?choose([15,30,45]):level===2?choose([5,10,15,20,30]):choose([3,7,11,15,22]);
    const shownH=wrongHand==='hour'?((trueH+choose([1,2,3,4])-1)%12)+1:trueH;
    const shownM=wrongHand==='minute'?(trueM+offset)%60:trueM;
    return {kind:'repair',category:'repair',answerType:'repair',answer:start,start,wrongHand,shownH,shownM,
      prompt:`🔧 Ten zegar miał pokazywać ${display(start)}, ale JEDNA wskazówka jest źle ustawiona.\nDotknij i popraw błędną wskazówkę.`,
      explanation:`Poprawne wskazówki pokazują ${display(start)}.`};
  }
  function mystery(level,ctx){
    const name=hero(ctx),minutes=choose(level===1?[15,30,45]:level===2?[5,10,15,20,25,30,35,40,45,50,55]:[5,10,15,20,25,30,35,40,45,50,55]),h=choose([8,9,10,11,12,13,14,15,16,17,18]),start=h*60+minutes;
    const prior=start-(level===1?10:level===2?8:7),later=start+(level===1?10:level===2?8:7),on=minutes/5;
    return {kind:'mystery',category:'mystery',answerType:'time',answer:start,start,
      prompt:`🎯 ${name} szuka tajemniczej godziny. Jest później niż ${display(prior)}, ale wcześniej niż ${display(later)}. Długa wskazówka wskazuje cyfrę ${on===12?12:on}.\nKtóra to godzina?`,explanation:`Długa wskazówka na ${on} oznacza ${minutes} minut, czyli ${display(start)}.`};
  }
  function generate(kind,level,ctx){
    if(kind==='detective')return detective(level,ctx);
    if(kind==='rescue')return rescue(level,ctx);
    if(kind==='schedule')return schedule(level,ctx);
    if(kind==='duel')return duel(level);
    if(kind==='ontime')return ontime(level,ctx);
    if(kind==='midnight')return midnight(level,ctx);
    if(kind==='repair')return repair(level);
    if(kind==='mystery')return mystery(level,ctx);
    throw Error('Nieznany typ zagadki: '+kind);
  }
  function quest(level){
    const beginning=time(level,12,15),balloons=level===1?30:choose([20,25,30]),cake=level===1?45:choose([35,40,45]),decor=level===1?30:choose([15,20,25]),journey=level===1?15:choose([15,20,25]);
    const t1=beginning+balloons,t2=t1+cake,t3=t2+decor,returnTime=t3+2*journey,leave=returnTime-journey;
    const guest=returnTime+(level===1?15:choose([10,15,20]));
    const stories=[
      {
        name:'🎂 Uratuj urodziny Stitcha!',
        first:`🌺 MISJA 1/5 — Stitch zaczyna dekorować salę balonami o ${display(beginning)}. Potrzebuje ${minutePhrase(balloons)}. O której kończy?`,
        second:`🎂 MISJA 2/5 — Lilo zaczyna piec tort o ${display(t1)}. Pieczenie trwa ${minutePhrase(cake)}. Kiedy tort będzie gotowy?`,
        third:`🎊 MISJA 3/5 — Tort jest gotowy o ${display(t2)}. Zawieszenie girland zajmie ${minutePhrase(decor)}. O której sala będzie gotowa?`,
        fourth:`🚀 MISJA 4/5 — Stitch chce wrócić do sali o ${display(returnTime)}. Droga powrotna trwa ${minutePhrase(journey)}. O której najpóźniej musi wyruszyć?`,
        fifth:`🎉 MISJA 5/5 — Stitch wrócił o ${display(returnTime)}, a goście przyjdą o ${display(guest)}. Ile minut zostało na przygotowania?`
      },
      {
        name:'🌊 Wyprawa Vaiany!',
        first:`⛵ MISJA 1/5 — Vaiana zaczyna przygotowywać żagiel o ${display(beginning)}. Potrzebuje ${minutePhrase(balloons)}. Kiedy skończy?`,
        second:`🗺️ MISJA 2/5 — Maui rozpoczyna rysowanie mapy o ${display(t1)}. Zajmie mu to ${minutePhrase(cake)}. Kiedy mapa będzie gotowa?`,
        third:`🥥 MISJA 3/5 — Mapa jest gotowa o ${display(t2)}. Pakowanie jedzenia zajmie ${minutePhrase(decor)}. O której łódź będzie gotowa?`,
        fourth:`🌺 MISJA 4/5 — Vaiana chce wrócić na łódź o ${display(returnTime)}. Droga trwa ${minutePhrase(journey)}. O której najpóźniej musi wyruszyć?`,
        fifth:`🌊 MISJA 5/5 — Vaiana wróciła o ${display(returnTime)}, a załoga wypłynie o ${display(guest)}. Ile minut zostało do wypłynięcia?`
      },
      {
        name:'❄️ Zimowy bal Elsy!',
        first:`✨ MISJA 1/5 — Elsa zaczyna budować lodowe dekoracje o ${display(beginning)}. Praca zajmie ${minutePhrase(balloons)}. O której skończy?`,
        second:`🍰 MISJA 2/5 — Anna zaczyna przygotowywać ciasto o ${display(t1)}. Zajmuje jej to ${minutePhrase(cake)}. Kiedy ciasto będzie gotowe?`,
        third:`☃️ MISJA 3/5 — Ciasto jest gotowe o ${display(t2)}. Olaf musi jeszcze rozłożyć ozdoby przez ${minutePhrase(decor)}. O której skończy?`,
        fourth:`🎶 MISJA 4/5 — Elsa chce wrócić do pałacu z muzyką o ${display(returnTime)}. Droga zajmuje ${minutePhrase(journey)}. O której najpóźniej musi wyruszyć?`,
        fifth:`❄️ MISJA 5/5 — Elsa wróciła o ${display(returnTime)}, a bal rozpocznie się o ${display(guest)}. Ile minut zostało?`
      }
    ];
    const story=choose(stories);
    return [
      {kind:'quest',category:'calc',answerType:'time',answer:wrap(t1),start:beginning,prompt:story.first,explanation:`${display(beginning)} + ${balloons} min = ${display(t1)}.`,missionName:story.name},
      {kind:'quest',category:'life',answerType:'time',answer:wrap(t2),start:t1,prompt:story.second,explanation:`${display(t1)} + ${cake} min = ${display(t2)}.`,missionName:story.name},
      {kind:'quest',category:'schedule',answerType:'time',answer:wrap(t3),start:t2,prompt:story.third,explanation:`${display(t2)} + ${decor} min = ${display(t3)}.`,missionName:story.name},
      {kind:'quest',category:'rescue',answerType:'time',answer:wrap(leave),start:returnTime,prompt:story.fourth,explanation:`${display(returnTime)} − ${journey} min = ${display(leave)}.`,missionName:story.name},
      {kind:'quest',category:'duel',answerType:'minutes',answer:guest-returnTime,start:returnTime,prompt:story.fifth,explanation:`${display(guest)} − ${display(returnTime)} = ${guest-returnTime} min.`,missionName:story.name}
    ];
  }
  global.ClockExtras={kinds,hints,allKinds,forLevel,buildPlan,generate,quest,readProgress,noteProgress,weakness,display};
})(window);