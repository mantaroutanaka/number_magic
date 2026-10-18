/* 数の魔法 — 量から数へ / 2026 */
(() => {
"use strict";
const ROOT = document.getElementById("app");
const READ = ["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう","じゅう"];
const COUNT_THINGS = [
  ["🦕","きょうりゅう"],["🐟","さかな"],["🦋","ちょうちょ"],["🐞","てんとうむし"],["🐙","たこ"],
  ["🐢","かめ"],["🐠","おさかな"],["🐚","かいがら"],["🐦","とり"],["🐬","いるか"]
];
const STAGES = [];
function addCountingStages(n,chapter){
  STAGES.push({id:"count-"+n,kind:"count",n:n,emoji:COUNT_THINGS[n-1][0],thing:COUNT_THINGS[n-1][1],chapter:chapter,name:n+"こ を みつけよう"});
  STAGES.push({id:"quantity-"+n,kind:"quantity",n:n,avoidEmoji:COUNT_THINGS[n-1][0],chapter:chapter,name:n+"この ものは どれかな？"});
}
for(let n=1;n<=5;n++)addCountingStages(n,0);
for(let a=1;a<=4;a++)STAGES.push({id:"make5-"+a,kind:"pair",target:5,a:a,chapter:1,name:a+"と いくつで 5？"});
STAGES.push({id:"make5-free",kind:"pair",target:5,a:null,chapter:1,name:"じぶんで 5を つくろう"});
for(let n=6;n<=10;n++){
  addCountingStages(n,2);
  STAGES.push({id:"fiveplus-"+n,kind:"pair",target:n,a:5,chapter:2,name:"5と いくつで "+n+"？"});
}
for(let a=1;a<=5;a++)STAGES.push({id:"make10-"+a,kind:"pair",target:10,a:a,chapter:3,name:a+"と いくつで 10？"});
STAGES.forEach(stage=>stage.chapter++);
STAGES.unshift(
  {id:"compare-more",kind:"compare",chapter:0,name:"どちらがおおい？"},
  {id:"compare-capacity",kind:"capacity",chapter:0,name:"かさくらべ"},
  {id:"compare-length",kind:"length",chapter:0,name:"ながさくらべ"},
  {id:"compare-area",kind:"area",chapter:0,name:"ひろさくらべ"},
  {id:"find-friends",kind:"classify",chapter:0,name:"なかまはどれ？"}
);
const CHAPTERS = [
  {name:"まずは くらべて なかまわけ",sub:"かず・かさ・ながさ・ひろさ → なかまはどれ？",icon:"🌷"},
  {name:"① 1〜5を かぞえよう",sub:"えを かぞえる → その かずを さがす",icon:"🔎"},
  {name:"② 5を つくろう",sub:"2つの タイルで 5を つくる",icon:"🌱"},
  {name:"③ 6〜10を かぞえて つくろう",sub:"かぞえる → えらぶ → 5と あといくつ？",icon:"🌈"},
  {name:"④ 10を つくろう",sub:"2つの タイルで 10を つくる",icon:"🏰"}
];
const KEY = "number-magic-learning-v2";
function migrateProgress(p){
  const ids=STAGES.map(st=>st.id),current=p&&p.version===4;
  function oldId(i){
    const previous=p&&p.version===3,limit=previous?35:25;
    if(!Number.isInteger(i)||i<0||i>=limit)return null;
    const oldIndex=previous?i:i<10?i*2:i+10;
    if(oldIndex<20)return (oldIndex%2?"quantity-":"count-")+(Math.floor(oldIndex/2)+1);
    if(oldIndex<24)return "make5-"+(oldIndex-19);
    if(oldIndex===24)return "make5-free";
    if(oldIndex<30)return "fiveplus-"+(oldIndex-19);
    return "make10-"+(oldIndex-29);
  }
  const toId=value=>current?(ids.includes(value)?value:null):oldId(value);
  return {version:4,done:p&&Array.isArray(p.done)?[...new Set(p.done.map(toId).filter(id=>ids.includes(id)))]:[],last:p&&toId(p.last)||ids[0]};
}
let progress=migrateProgress(null);
try {progress=migrateProgress(JSON.parse(localStorage.getItem(KEY)||"null"));}catch(e){}
const state={screen:"home",index:0,objects:[],groups:[],selected:null,quantityShown:0,quantityChecked:false,quantityCounting:false,found:[],first:null,second:null,feedback:"",win:false,free:false,goal:5};
let quantityTimer=null;
function stopQuantityCount(){clearTimeout(quantityTimer);quantityTimer=null;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(progress))}catch(e){}}
function el(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text!==undefined&&text!==null)node.textContent=String(text);
  return node;
}
function add(parent,...nodes){nodes.flat().forEach(node=>{if(node!==null&&node!==undefined)parent.append(node)});return parent}
function button(label,handler,cls,disabled){
  const b=el("button",cls||"btn",label);b.type="button";if(disabled)b.disabled=true;
  b.addEventListener("click",handler);return b;
}
function speak(s){
  if(!("speechSynthesis" in window))return;
  try {
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(s);u.lang="ja-JP";u.rate=.82;u.pitch=1.07;
    const voices=speechSynthesis.getVoices();
    const ja=voices.find(v=>v.lang.toLowerCase().startsWith("ja"));
    if(ja)u.voice=ja;
    speechSynthesis.speak(u);
  }catch(e){}
}
function goHome(){stopQuantityCount();state.screen="home";render();window.scrollTo(0,0)}
function enter(i){
  if(i<0||i>=STAGES.length)return;
  stopQuantityCount();
  state.groups=STAGES[i].kind==="quantity"?quantityGroups(STAGES[i]):[];
  state.intro=makeIntro(STAGES[i].kind);
  state.measure=makeMeasurement(STAGES[i].kind);
  state.selected=null;state.quantityShown=0;state.quantityChecked=false;state.quantityCounting=false;
  state.screen="stage";state.index=i;state.objects=STAGES[i].kind==="count"?shuffledObjects(STAGES[i]):[];state.found=[];state.first=null;state.second=null;state.feedback="";state.win=false;state.free=false;
  progress.last=STAGES[i].id;save();render();window.scrollTo(0,0);
}
function enterFree(){
  stopQuantityCount();
  state.screen="free";state.free=true;state.first=null;state.second=null;state.goal=5;state.feedback="";state.win=false;
  render();window.scrollTo(0,0);
}
function finish(){
  state.win=true;
  if(!state.free&&!progress.done.includes(STAGES[state.index].id)){progress.done.push(STAGES[state.index].id);save()}
}
function unlocked(){for(let i=0;i<STAGES.length;i++)if(!progress.done.includes(STAGES[i].id))return i;return STAGES.length-1}
function header(){
  const h=el("header","head");
  const brand=el("div","brand");add(brand,el("span","brand-bubble","🦕"),el("span","", "数の魔法"));
  add(h,brand,el("span","chip","⭐ "+progress.done.length+" / "+STAGES.length));
  return h;
}
function home(){
  const wrap=el("main","appwrap");wrap.append(header());
  const hero=el("section","hero");
  add(hero,el("span","eyebrow","さわって ひらめく さんすう"),el("div","hero-mascot","🦕"),el("h1","","数の魔法"));
  add(hero,el("p","","かぞえて、ならべて、くっつけて。じぶんの てで かずを みつけよう。"));
  const acts=el("div","actions");
  add(acts,button(progress.done.length?"つづきから あそぶ":"はじめから あそぶ",()=>enter(unlocked()),"btn btn-primary"),button("じゆうに ためす",enterFree,"btn btn-secondary"));
  hero.append(acts);wrap.append(hero);
  const road=el("div","learning-road");
  add(road,el("strong","","この じゅんばんで あそぶよ"),el("p","","くらべる・なかまわけ → ① 1〜5を かぞえる → ② 5を つくる → ③ 6〜10を かぞえて 5から ふやす → ④ 10を つくる"));
  wrap.append(road);
  CHAPTERS.forEach((ch,k)=>{
    const group=el("section","chapter");
    const heading=el("div","section-heading");
    add(heading,el("h2","",ch.icon+" "+ch.name),el("span","",ch.sub));group.append(heading);
    const grid=el("div","stage-grid");
    STAGES.forEach((st,i)=>{
      if(st.chapter!==k)return;
      const locked=i>unlocked()&&!progress.done.includes(STAGES[i].id);
      const b=button(" ",()=>enter(i),"stage-card"+(locked?" locked":""),locked);
      b.textContent="";
      add(b,el("span","num",progress.done.includes(STAGES[i].id)?"⭐ "+(i+1):"♧ "+(i+1)),el("span","title",st.name),el("span","mini",locked?"🔒 じゅんばんに あそぼう":progress.done.includes(STAGES[i].id)?"もういちど あそべる":"タップして あそぶ"));
      grid.append(b);
    });
    group.append(grid);wrap.append(group);
  });
  wrap.append(el("p","footer-note","広告・ログインなし。進みぐあいは この端末に 保存されるよ。"));
  return wrap;
}
function gameShell(chapter,title,prompt,body){
  const wrap=el("main","appwrap");wrap.append(header());
  const nav=el("nav","game-top");
  add(nav,button("← しまの ちず",goHome,"iconbtn"),el("span","game-progress",state.free?"じゆう モード":"ステージ "+(state.index+1)+" / "+STAGES.length));
  wrap.append(nav);
  const card=el("section","game-card");
  const titleRow=el("div","game-titleline"),tit=el("div","");
  add(tit,el("span","game-label",chapter),el("h1","",title));add(titleRow,tit,el("span","corner-emoji","🦕"));
  card.append(titleRow);
  const mascot=el("div","mascot-talk");
  add(mascot,el("span","face","🦕"),el("div","speech",prompt));card.append(mascot);
  card.append(body);
  wrap.append(card);
  wrap.append(el("p","footer-note","まちがえても だいじょうぶ。ためして かんがえて みよう。"));
  return wrap;
}
function tileRow(target,firstFill,secondFill,asCounting){
  const row=el("div","tile-row");row.style.gridTemplateColumns="repeat("+(asCounting?10:target)+",minmax(0,1fr))";row.setAttribute("role","img");
  row.setAttribute("aria-label",target+"このうち"+(firstFill+secondFill)+"こ");
  for(let i=0;i<Math.max(target,asCounting?10:target);i++){
    const filled=i<firstFill?"first":i<firstFill+secondFill?"second":"";
    const unit=el("span","unit "+(i>=target?"outside":filled)+(i===5?" six":""));
    unit.dataset.i=String(i);
    unit.append(el("span","dot",filled?"●":""));
    row.append(unit);
  }
  return row;
}
function numberRead(n,small){
  const card=el("div",small?"mini-reading":"number-reading");
  add(card,el("strong","big-num",n),el("span","num-say", "「"+READ[n]+"」"));
  return card;
}
function voiceButton(n){
  return button("🔊 「"+READ[n]+"」を きく",()=>speak(READ[n]),"tool voice-button");
}
function feedback(){
  return state.feedback?el("div","feedback info",state.feedback):null;
}
function success(summary,extra){
  const box=el("div","success-box");
  add(box,el("div","success-star","✨ ⭐ ✨"),el("h2","","できたね！"),el("p","",summary));
  if(extra)box.append(el("p","success-extra",extra));
  const actions=el("div","actions");
  if(state.free){
    actions.append(button("もういちど ためす",()=>{state.first=null;state.second=null;state.win=false;state.feedback="";render()},"btn btn-primary"));
  }else if(state.index<STAGES.length-1){
    actions.append(button("つぎに すすむ →",()=>enter(state.index+1),"btn btn-primary"));
  }else{
    actions.append(button("しまの ちずへ",goHome,"btn btn-primary"));
  }
  add(actions,button("しまの ちず",goHome,"btn btn-secondary"));
  box.append(actions);return box;
}
function shuffle(items){
  const arr=items.slice();
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}
function shuffledObjects(stage){
  const arr=[];
  for(let i=0;i<stage.n;i++)arr.push({id:"t"+i,emoji:stage.emoji,target:true});
  const others=shuffle(["🌼","🪨","🌲","⭐","🍄","🌷","🦀","🐌"].filter(emoji=>emoji!==stage.emoji));
  // A same-count category prevents frequency alone from identifying the target.
  // For 1, also include two repeated categories so the scene is not all singletons.
  const nearby=stage.n===2?3:stage.n===10?9:stage.n+(Math.random()<.5?-1:1);
  const counts=stage.n===1?[1,2,2]:[stage.n,nearby];
  counts.forEach((count,category)=>{
    for(let i=0;i<count;i++)arr.push({id:"d"+category+"-"+i,emoji:others[category],target:false});
  });
  return shuffle(arr);
}
function quantityGroups(stage){
  const choices=shuffle(COUNT_THINGS.filter(([emoji])=>emoji!==stage.avoidEmoji&&emoji!=="🐠"&&!(stage.avoidEmoji==="🐠"&&emoji==="🐟"))).slice(0,3);
  const nearby=shuffle(Array.from({length:10},(_,i)=>i+1).filter(n=>n!==stage.n&&Math.abs(n-stage.n)<=2)).slice(0,2);
  const counts=[stage.n,...nearby];
  return shuffle(counts.map((count,i)=>({id:"q"+i,emoji:choices[i][0],thing:choices[i][1],count})));
}

function makeMeasurement(kind){
  const sets={
    capacity:[
      [{w:2,h:3},{w:2,h:4}],
      [{w:1,h:6},{w:4,h:2}],
      [{w:3,h:3},{w:2,h:4}]
    ],
    length:[
      [{n:4,style:"ribbon"},{n:6,style:"ribbon"}],
      [{n:5,style:"pencil"},{n:7,style:"pencil"}],
      [{n:6,style:"train"},{n:4,style:"train"}]
    ],
    area:[
      [{w:3,h:2},{w:4,h:3}],
      [{w:4,h:2},{w:3,h:3}],
      [{w:2,h:4},{w:3,h:2}]
    ]
  };
  if(!sets[kind])return null;
  return {kind,round:0,solved:false,rounds:sets[kind].map(pair=>{
    const choices=shuffle(pair).map((item,i)=>({...item,label:i===0?"あ":"い",value:kind==="length"?item.n:item.w*item.h}));
    return {choices,answer:choices[0].value>choices[1].value?0:1};
  })};
}
function chooseMeasurement(index){
  const task=state.measure;
  if(state.win||task.solved||!Number.isInteger(index)||index<0||index>1)return;
  state.selected=index;
  const problem=task.rounds[task.round];
  if(index===problem.answer){
    task.solved=true;state.feedback="";
    if(task.round===task.rounds.length-1)finish();
  }else state.feedback="そろえて たしかめよう。もういちど えらんで みよう。";
  render();
}
function nextMeasurement(){
  const task=state.measure;
  if(!task.solved||task.round>=task.rounds.length-1)return;
  task.round++;task.solved=false;state.selected=null;state.feedback="";render();
}
function measureShape(kind,item,reveal){
  const wrap=el("div","measure-shape");
  if(kind==="capacity"){
    const vessel=el("div","measure-vessel");
    vessel.style.width=(item.w*22)+"px";vessel.style.height=(item.h*22+12)+"px";
    vessel.append(el("span","measure-water"));
    wrap.append(vessel);
  }else if(kind==="length"){
    const track=el("div","measure-track"+(reveal?" aligned":""));
    const strip=el("div","measure-strip "+item.style);
    strip.style.width=(item.n/8*100)+"%";
    if(item.style==="train")for(let i=0;i<item.n;i++)strip.append(el("span","train-car","▰"));
    track.append(strip);wrap.append(track);
  }else{
    const paper=el("div","measure-paper"+(reveal?" gridded":""));
    paper.style.gridTemplateColumns="repeat("+item.w+",22px)";
    for(let i=0;i<item.value;i++)paper.append(el("span","paper-square"));
    wrap.append(paper);
  }
  wrap.setAttribute("aria-hidden","true");return wrap;
}
function measurementResult(task){
  const problem=task.rounds[task.round],panel=el("section","comparison-result");
  const kind=task.kind,unit=kind==="capacity"?"はい":kind==="length"?"ます":"ます";
  const title=kind==="capacity"?"おなじ コップに うつしたよ":kind==="length"?"はしを そろえたよ":"おなじ おおきさの ますで くらべよう";
  add(panel,el("h2","",title),el("p","",kind==="capacity"?"どの コップも おなじ おおきさ。すべて いっぱいに して くらべるよ。":kind==="length"?"ひだりの はしを そろえて、おなじ ながさの ますで くらべるよ。":"ますの おおきさは みんな おなじ。かたちが ちがっても、ますの かずで くらべられるよ。"));
  problem.choices.forEach((item,i)=>{
    const row=el("div","measure-result-row");
    row.append(el("strong","",item.label+(state.selected===i?"（えらんだ ほう）":"")));
    if(kind==="length"){
      row.append(measureShape(kind,item,true));
      const ruler=el("div","measure-ruler");
      for(let j=0;j<8;j++)ruler.append(el("span","",j<item.n?"●":""));
      row.append(ruler);
    }else if(kind==="area"){
      row.append(measureShape(kind,item,true));
      const tiles=el("div","measure-tiles");
      for(let j=0;j<item.value;j++)tiles.append(el("span","area-unit"));
      row.append(tiles);
    }else{
      const cups=el("div","measure-cups");
      for(let j=0;j<item.value;j++)cups.append(el("span","measure-cup"));
      row.append(cups);
    }
    row.append(el("span","",item.value+unit));panel.append(row);
  });
  const values=problem.choices.map(item=>item.value),difference=Math.abs(values[0]-values[1]);
  panel.append(el("p","comparison-summary",kind==="capacity"?"コップ "+difference+"はいぶん ちがうね。":kind==="length"?difference+"ますぶん ながさが ちがうね。":difference+"ますぶん ひろさが ちがうね。"));
  return panel;
}
function measurementGame(){
  const st=STAGES[state.index],task=state.measure,problem=task.rounds[task.round],kind=task.kind,body=el("div","");
  const prompt=kind==="capacity"?"みずの かさが おおいのは どちら？":kind==="length"?"ながいのは どちら？":"ひろいのは どちら？";
  body.append(el("p","round-progress",(task.round+1)+" / "+task.rounds.length+" もん"));
  body.append(el("p","quantity-instruction",kind==="capacity"?"はこの かたちの いれものだよ。どちらも おくゆきは おなじ。みずの りょうを くらべよう。":kind==="length"?"はしを そろえると、たしかめられるよ。":"いろの ついた かみの ひろさを くらべよう。"));
  body.append(button("🔊 もんだいを きく",()=>speak(prompt),"tool"));
  const options=el("div","intro-options compare-options measurement-options");
  problem.choices.forEach((item,i)=>{
    const b=button("",()=>chooseMeasurement(i),"quantity-option"+(state.selected===i?" selected":""),task.solved||state.win);
    b.setAttribute("aria-label",item.label+"を えらぶ");b.setAttribute("aria-pressed",String(state.selected===i));
    add(b,el("strong","",item.label),measureShape(kind,item,false),el("span","quantity-pick","えらぶ"));options.append(b);
  });
  body.append(options);
  if(state.selected!==null)body.append(measurementResult(task));
  if(state.feedback)body.append(feedback());
  if(task.solved&&!state.win)body.append(button("できたね！ つぎの もんだい →",nextMeasurement,"btn btn-primary quantity-check"));
  if(state.win)body.append(success(st.name+"、できたね！","そろえて くらべると、たしかめられるね。"));
  body.append(button("⟳ はじめから ためす",()=>{state.measure=makeMeasurement(kind);state.selected=null;state.feedback="";state.win=false;render();},"tool"));
  return gameShell(CHAPTERS[st.chapter].name,st.name,prompt,body);
}


function makeIntro(kind){
  if(kind==="compare"){
    const counts=shuffle([2,4]),[emoji,thing]=shuffle(COUNT_THINGS)[0];
    return {groups:counts.map((count,i)=>({id:"intro-"+i,count,emoji,thing})),answer:counts.indexOf(4)};
  }
  if(kind==="classify"){
    // Each rule names the set explicitly: an object can belong to other sets too.
    const problems=[
      {rule:"きつねの なかま",members:[["🦊","きつね"]],odd:["🦆","あひる"],why:"あひるは きつねでは ないね。どちらも どうぶつの なかまには はいるよ。"},
      {rule:"どうぶつの なかま",members:[["🐶","いぬ"],["🐱","ねこ"],["🐘","ぞう"],["🦁","らいおん"],["🐰","うさぎ"],["🐢","かめ"]],odd:["🌷","はな"],why:"はなは どうぶつでは ないね。でも、どうぶつも はなも いきものだよ。"},
      {rule:"くるまの なかま",members:[["🚗","くるま"],["🚌","ばす"],["🚕","たくしー"],["🚒","しょうぼうしゃ"],["🚑","きゅうきゅうしゃ"]],odd:["🦋","ちょうちょ"],why:"ちょうちょは むしの なかま。くるまの なかまには はいらないね。"},
      {rule:"くだものの なかま",members:[["🍎","りんご"],["🍌","ばなな"],["🍇","ぶどう"],["🍊","みかん"],["🍓","いちご"]],odd:["👟","くつ"],why:"くつは みにつける もの。くだものの なかまには はいらないね。"},
      {rule:"えんじんや もーたーで はしる のりもの",members:[["🚗","くるま"],["🚌","ばす"],["🚕","たくしー"],["🚒","しょうぼうしゃ"],["🚑","きゅうきゅうしゃ"],["🚚","とらっく"]],odd:["🚲","じてんしゃ"],why:"ここでの じてんしゃは でんどうでは なく、あしで こいで はしるよ。みんな のりものだけど、この なかまの きまりからは はずれるね。",note:"じてんしゃは、でんどうでは ない ものと するよ。"},
      {rule:"いまも しぜんの なかで いきている どうぶつ",members:[["🐘","ぞう"],["🦒","きりん"],["🦁","らいおん"],["🐢","かめ"],["🐊","わに"],["🦓","しまうま"]],odd:["🦤","どーどー"],why:"どーどーは むかし いきていた どうぶつ。ぜつめつして、いまは いないよ。どうぶつの なかまだけど、いまも いきている どうぶつの なかまからは はずれるね。"},
      {rule:"たべる ときに つかう しょっき・どうぐ",members:[["🍽️","おさら"],["🥣","おわん"],["🥄","すぷーん"],["🍴","ふぉーく"],["🥢","はし"],["☕","かっぷ"]],odd:["🪏","しゃべる"],why:"しゃべるは つちを ほる ときに つかうよ。すぷーんと にているけど、たべる ときの どうぐでは ないね。"},
      {rule:"そらを とんで いどうできる どうぶつ",members:[["🦋","ちょうちょ"],["🐝","はち"],["🦅","わし"],["🦇","こうもり"],["🦉","ふくろう"]],odd:["🐧","ぺんぎん"],why:"ぺんぎんは とりだけど、そらは とべないよ。こうもりは とりでは ないけど、そらを とぶ なかまに はいるね。"},
      {rule:"みずの なかで くらす どうぶつ",members:[["🐟","さかな"],["🐙","たこ"],["🐬","いるか"],["🐋","くじら"],["🦈","さめ"]],odd:["🦒","きりん"],why:"きりんは りくで くらすよ。いるかや くじらは さかなでは ないけど、みずの なかで くらす なかまだね。"},
      {rule:"おんがくを かなでる がっき",members:[["🎸","ぎたー"],["🎻","ばいおりん"],["🎺","とらんぺっと"],["🥁","たいこ"],["🪈","ふえ"]],odd:["🔨","かなづち"],why:"かなづちも おとは でるけど、ここでは ものを つくる どうぐ。おんがくを かなでる がっきの なかまから はずれるね。"}
    ];
    const rounds=problems.map(problem=>{
      // Only the introductory same-animal task uses repeated pictures.
      // All later tasks give every picture the same frequency (one).
      const pictures=problem.members.length===1?Array(8).fill(problem.members[0]):problem.members;
      const members=pictures.map(picture=>({picture,odd:false}));
      const choices=shuffle([...members,{picture:problem.odd,odd:true}]);
      return {...problem,choices,answer:choices.findIndex(item=>item.odd)};
    });
    return {rounds,round:0,solved:false};
  }
  return null;
}
function chooseIntro(index){
  const task=state.intro,compare=STAGES[state.index].kind==="compare";
  if(state.win||(!compare&&task.solved))return;
  const problem=compare?task:task.rounds[task.round];
  if(!Number.isInteger(index)||index<0||index>=(compare?2:problem.choices.length))return;
  state.selected=index;
  if(index===problem.answer){
    state.feedback="";
    if(compare)finish();
    else{
      task.solved=true;
      if(task.round===task.rounds.length-1)finish();
    }
  }else state.feedback=compare
    ?"ならべると、こちらは すくないね。あまる ほうを えらびなおそう。"
    :"この えは「"+problem.rule+"」に はいるよ。きまりから はずれる ものを さがそう。";
  render();
}
function nextIntroRound(){
  const task=state.intro;
  if(!task.solved||task.round>=task.rounds.length-1)return;
  task.round++;task.solved=false;state.selected=null;state.feedback="";render();
}
function comparisonResult(task){
  const panel=el("section","comparison-result");
  add(panel,el("h2","","1こずつ ならべて くらべよう"),el("p","","おなじ れつの えが 1たい1の ぺあ。あまった えが ある ほうが おおいね。"));
  const grid=el("div","comparison-grid");
  const max=Math.max(...task.groups.map(group=>group.count)),min=Math.min(...task.groups.map(group=>group.count));
  task.groups.forEach((group,i)=>grid.append(el("strong","comparison-label",(i===0?"ひだり":"みぎ")+(state.selected===i?"（えらんだ ほう）":""))));
  for(let row=0;row<max;row++)task.groups.forEach(group=>{
    const present=row<group.count;
    const cell=el("span","comparison-cell"+(!present?" empty":row>=min?" surplus":" paired"),present?group.emoji:"");
    cell.setAttribute("aria-label",present?(row>=min?"あまった ":"ぺあの ")+group.thing:"ぺあが ない ます");
    grid.append(cell);
  });
  panel.append(grid);
  panel.append(el("p","comparison-summary","ひだり "+task.groups[0].count+"こ、みぎ "+task.groups[1].count+"こ。"+(max-min)+"こ あまるよ。"));
  return panel;
}
function introGame(){
  const st=STAGES[state.index],task=state.intro,body=el("div","");
  const compare=st.kind==="compare",problem=compare?null:task.rounds[task.round];
  if(!compare){
    body.append(el("p","round-progress",(task.round+1)+" / "+task.rounds.length+" もん"));
    const rule=el("section","set-rule");
    add(rule,el("strong","","なかまの きまり"),el("p","",problem.rule));
    if(problem.note)rule.append(el("p","muted-note",problem.note));
    body.append(rule);
    body.append(button("🔊 きまりを きく",()=>speak(problem.rule+(problem.note||"")),"tool"));
  }
  body.append(el("p","quantity-instruction",compare
    ?"おおい ほうを タップしよう。えらんだら、1こずつ ならべて たしかめるよ。"
    :"この きまりに はいらない ものを、ひとつ さがそう。"));
  const options=el("div",compare?"intro-options compare-options":"odd-options");
  const choices=compare?task.groups:problem.choices;
  choices.forEach((item,i)=>{
    const b=button("",()=>chooseIntro(i),"quantity-option"+(state.selected===i?" selected":""),state.win||(!compare&&task.solved));
    b.setAttribute("aria-pressed",String(state.selected===i));
    if(compare){
      b.setAttribute("aria-label",(i===0?"ひだり":"みぎ")+"の "+item.thing+"を えらぶ");
      const pictures=el("span","intro-pictures");pictures.setAttribute("aria-hidden","true");
      for(let j=0;j<item.count;j++)pictures.append(el("span","quantity-picture",item.emoji));
      b.append(pictures);
    }else{
      b.setAttribute("aria-label",item.picture[1]+"を えらぶ");
      add(b,el("span","odd-picture",item.picture[0]),el("span","quantity-name",item.picture[1]));
    }
    b.append(el("span","quantity-pick",state.selected===i?"✓ これに する":"えらぶ"));
    options.append(b);
  });
  body.append(options);
  if(compare&&state.selected!==null)body.append(comparisonResult(task));
  if(!compare&&task.solved){
    const explanation=el("section","set-explanation");
    add(explanation,el("h2","","みつけたね！"),el("p","",problem.why));
    explanation.append(button("🔊 おはなしを きく",()=>speak(problem.why),"tool"));
    if(!state.win)explanation.append(button("つぎの もんだい →",nextIntroRound,"btn btn-primary quantity-check"));
    body.append(explanation);
  }
  if(state.win)body.append(success(compare
    ?"あまる ほうが おおいね！"
    :"いろいろな きまりで なかまわけ できたね！",
    compare?null:"おなじ ものでも、きまりが かわると はいる なかまが かわるよ。"));
  else if(state.feedback)body.append(feedback());
  body.append(button(compare?"⟳ ちがう えで ためす":"⟳ はじめの もんだいから",()=>{
    state.intro=makeIntro(st.kind);state.selected=null;state.feedback="";state.win=false;render();
  },"tool"));
  return gameShell(CHAPTERS[st.chapter].name,st.name,compare
    ?"どちらがおおい？ えを くらべよう。"
    :"なかまはどれ？ きまりに はいらない ものを さがそう。",body);
}

function resetCounting(){
  state.objects=shuffledObjects(STAGES[state.index]);
  state.found=[];state.win=false;state.feedback="";
  render();
}
function flyEmoji(emoji,from,index){
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  requestAnimationFrame(()=>{
    const cell=document.querySelector('.unit[data-i="'+index+'"]');
    if(!cell)return;
    const target=cell.getBoundingClientRect();
    const flying=el("span","flying-emoji",emoji);
    flying.style.left=(from.left+from.width/2)+"px";flying.style.top=(from.top+from.height/2)+"px";
    document.body.append(flying);
    try{
      const animation=flying.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:"translate("+((target.left+target.width/2)-(from.left+from.width/2))+"px,"+((target.top+target.height/2)-(from.top+from.height/2))+"px) translate(-50%,-50%) scale(.36)",opacity:.35}],{duration:620,easing:"cubic-bezier(.2,.7,.2,1)"});
      animation.onfinish=()=>flying.remove();animation.oncancel=()=>flying.remove();
    }catch(e){flying.remove()}
  });
}
function tapObject(obj,btn,st){
  if(state.win||state.found.includes(obj.id))return;
  if(!obj.target){
    state.feedback="これは "+obj.emoji+" だね。"+st.thing+" を さがそう！";
    render();return;
  }
  const rect=btn.getBoundingClientRect(),i=state.found.length;
  state.found.push(obj.id);
  state.feedback="";
  speak(READ[i+1]);
  render();
  flyEmoji(obj.emoji,rect,i);
}
function counting(){
  const st=STAGES[state.index],n=state.found.length;
  const body=el("div","");
  const task=el("div","count-task");
  add(task,el("span","task-emoji",st.emoji),el("strong","",st.thing+" を "+st.n+"こ みつけよう！"));
  body.append(task);
  const scene=el("section","picture-scene");
  scene.append(el("div","scene-hint","えの なかから さがして タップ！"));
  const items=el("div","scene-grid"+(state.objects.length>20?" dense":""));
  state.objects.forEach(obj=>{
    const done=state.found.includes(obj.id);
    const b=button(obj.emoji+(done?" ✓":""),()=>tapObject(obj,b,st),"scene-object"+(done?" found":""));
    b.setAttribute("aria-label",obj.emoji+(done?" かぞえた":" を タップ"));
    if(done)b.disabled=true;
    items.append(b);
  });
  scene.append(items);body.append(scene);
  const meter=el("section","number-meter");
  const top=el("div","meter-head");
  add(top,el("strong","","🧩 かぞえた かず"),el("span","meter-value",n+" / "+st.n+" こ"));
  meter.append(top);
  meter.append(tileRow(st.n,n,0,true));
  const reading=el("div","reading-line");
  if(n){
    add(reading,numberRead(n,true),voiceButton(n));
  }else{
    reading.append(el("span","muted-note","えを タップすると、タイルが 1こずつ ふえるよ。"));
  }
  meter.append(reading);body.append(meter);
  if(n===st.n){
    const confirm=el("section","count-confirm");
    add(confirm,el("div","confirm-celebrate","🎉 "+st.n+"この "+st.thing+" と "+st.n+"この タイル。おなじ かず！"));
    add(confirm,numberRead(st.n,false));
    if(!state.win){
      add(confirm,el("p","","こえに だして「"+READ[st.n]+"」と よんでみよう。"));
      add(confirm,button("「"+READ[st.n]+"」と よめた！",()=>{finish();render()},"btn btn-primary big-action"));
    }else{
      confirm.append(success(st.n+" は「"+READ[st.n]+"」と よむよ。","えの かず と タイルの かず が おなじだね。"));
    }
    body.append(confirm);
  }
  const tools=el("div","game-tools");
  add(tools,button("⟳ もういちど かぞえる",resetCounting,"tool"));
  body.append(tools);if(feedback())body.append(feedback());
  return gameShell(CHAPTERS[st.chapter].name,st.name,st.thing+" を みつけて、1こずつ かぞえよう。",body);
}
function resetQuantity(newScene){
  stopQuantityCount();
  if(newScene)state.groups=quantityGroups(STAGES[state.index]);
  state.selected=null;state.quantityShown=0;state.quantityChecked=false;state.quantityCounting=false;
  state.win=false;state.feedback="";render();
}
function selectQuantity(id){
  if(state.quantityChecked||state.win)return;
  state.selected=id;state.feedback="";render();
}
function checkQuantity(){
  if(state.quantityChecked||state.win)return;
  const group=state.groups.find(g=>g.id===state.selected),st=STAGES[state.index];
  if(!group)return;
  state.quantityChecked=true;state.quantityCounting=true;state.quantityShown=0;state.feedback="";render();
  function tick(){
    if(state.quantityShown<group.count){
      const picture=document.querySelector(".quantity-option.selected .quantity-picture:nth-child("+(state.quantityShown+1)+")");
      const rect=picture?picture.getBoundingClientRect():null,index=state.quantityShown;
      state.quantityShown++;speak(READ[state.quantityShown]);render();
      if(rect)flyEmoji(group.emoji,rect,index);
      quantityTimer=setTimeout(tick,360);
    }else{
      quantityTimer=null;state.quantityCounting=false;
      if(group.count===st.n){finish();}
      else state.feedback=group.thing+" は "+group.count+"こ だったね。"+st.n+"この ものを もういちど さがそう。";
      render();
    }
  }
  tick();
}
function quantityGame(){
  const st=STAGES[state.index],body=el("div","");
  const task=el("div","count-task");
  task.append(el("strong","",st.n+"この ものは どれかな？"));body.append(task);
  body.append(el("p","quantity-instruction","それぞれの えを かぞえて、なかまを ひとつ えらぼう。"));
  const options=el("div","quantity-options");
  state.groups.forEach(group=>{
    const selected=state.selected===group.id;
    const b=button("",()=>selectQuantity(group.id),"quantity-option"+(selected?" selected":""),state.quantityChecked||state.win);
    b.setAttribute("aria-label",group.thing+"を えらぶ");b.setAttribute("aria-pressed",String(selected));
    const pictures=el("span","quantity-pictures");pictures.setAttribute("aria-hidden","true");
    for(let i=0;i<group.count;i++)pictures.append(el("span","quantity-picture",group.emoji));
    add(b,pictures,el("span","quantity-name",group.thing),el("span","quantity-pick",selected?"✓ これに する":"えらぶ"));
    options.append(b);
  });
  body.append(options);
  if(!state.quantityChecked){
    body.append(button("これで たしかめる",checkQuantity,"btn btn-primary quantity-check",state.selected===null));
  }else{
    const group=state.groups.find(g=>g.id===state.selected);
    const meter=el("section","number-meter quantity-meter"),top=el("div","meter-head");
    add(top,el("strong","",group.thing+" を かぞえよう"),el("span","meter-value",state.quantityShown+"こ"));
    add(meter,top,tileRow(10,state.quantityShown,0,true));
    if(state.quantityShown){const reading=el("div","reading-line");add(reading,numberRead(state.quantityShown,true),voiceButton(state.quantityShown));meter.append(reading);}
    body.append(meter);
    if(state.quantityCounting)body.append(el("p","quantity-instruction","1こずつ タイルと くらべて みよう。"));
    else if(state.win)body.append(success(st.n+"この ものは "+group.emoji+" "+group.thing+"！",st.n+"この タイルと おなじ かずだね。"));
    else{body.append(feedback());body.append(button("もういちど えらぶ",()=>resetQuantity(false),"btn btn-primary quantity-check"));}
  }
  const tools=el("div","game-tools");tools.append(button("⟳ ちがう えで ためす",()=>resetQuantity(true),"tool"));body.append(tools);
  return gameShell(CHAPTERS[st.chapter].name,st.name,st.n+"こ あるのは、どの なかまかな？",body);
}
function currentPair(){
  if(state.free)return{target:state.goal,a:null,chapter:3,name:state.goal+"を つくろう"};
  return STAGES[state.index];
}
function chooseNumber(n){
  if(state.win)return;
  const st=currentPair();
  if(st.a!==null){
    state.first=st.a;
    state.second=n;
    const total=st.a+n;
    if(total===st.target){state.feedback="";finish();}
    else if(total<st.target)state.feedback="あと "+(st.target-total)+"こ あいているよ。あいている マスを みて えらびなおそう。";
    else state.feedback=(total-st.target)+"こ はみだすね。タイルを かえてみよう。";
    render();return;
  }
  if(state.first===null){
    state.first=n;state.second=null;state.feedback="つぎの タイルを ひとつ えらんでね。";
  }else{
    state.second=n;
    const total=state.first+state.second;
    if(total===st.target){
      state.feedback="";finish();
    }else if(total<st.target){
      state.feedback="あと "+(st.target-total)+"こ あいているよ。あいている マスを みて えらびなおそう。";
    }else{
      state.feedback=(total-st.target)+"こ はみだすね。タイルを かえてみよう。";
    }
  }
  render();
}
function tilesForChoice(n){
  const row=el("span","choice-units");
  for(let j=0;j<n;j++)row.append(el("span","choice-unit","•"));
  return row;
}
function choice(n,selected){
  const b=button("",()=>chooseNumber(n),"choice-card"+(selected?" active":""));
  b.append(el("strong","choice-number",String(n)));
  b.append(tilesForChoice(n));
  b.setAttribute("aria-label",n+"この タイルを えらぶ");
  return b;
}
function pairGame(){
  const st=currentPair();
  const body=el("div","");
  if(state.free){
    const switcher=el("div","free-switch");
    [5,10].forEach(n=>switcher.append(button(n+"を つくる",()=>{state.goal=n;state.first=null;state.second=null;state.win=false;state.feedback="";render()},"switch"+(state.goal===n?" active":""))));
    body.append(switcher);
  }
  const fixed=st.a!==null;
  const a=fixed?st.a:state.first,b=state.second;
  const base=el("section","equation-panel");
  let prompt;
  if(st.chapter===3&&!state.free){
    prompt="5こ の タイルから、あと いくつで "+st.target+"こ？";
  }else{
    prompt=st.target+"こ に なるように、2つの タイルを ならべよう。";
  }
  base.append(el("p","puzzle-prompt",prompt));
  const equation=el("div","equation");
  add(equation,el("span","eq-part",a===null?"□":a),el("span","eq-operator","＋"),el("span","eq-part",b===null?"□":b),el("span","eq-operator","＝"),el("span","eq-answer",st.target));
  base.append(equation);
  const fillA=a===null?0:a,fillB=b===null?0:b;
  const meter=el("div","pair-meter");
  add(meter,el("div","pair-meter-title","タイルを ならべて くらべよう"),tileRow(st.target,fillA,fillB,false));
  const label=el("div","pair-foot");
  const total=fillA+fillB;
  add(label,el("span","","いま "+total+"こ"),el("strong","",total===st.target?"ぴったり！":total<st.target?"あと "+(st.target-total)+"こ":" "+(total-st.target)+"こ はみだす"));
  meter.append(label);base.append(meter);
  if(st.chapter===3&&!state.free)base.append(el("div","five-explainer","🔵 まず 5こ。そこから "+(st.target-5)+"こ ふえると "+st.target+"こ。"));
  body.append(base);
  if(state.win){
    body.append(success(a+" と "+b+" で "+st.target+"！","2つの タイルだけで つくれたね。"));
  }else{
    const note=el("div","choice-heading");
    add(note,el("h2","",a===null?"① さいしょの タイルを えらぼう":"② あと ひとつの タイルを えらぼう"));
    body.append(note);
    const palette=el("div","choice-grid");
    const max=st.target===5?4:9;
    for(let n=1;n<=max;n++)palette.append(choice(n,b===n));
    body.append(palette);
    if(state.feedback)body.append(feedback());
  }
  const tools=el("div","game-tools");
  add(tools,button("⟳ やりなおす",()=>{state.first=null;state.second=null;state.win=false;state.feedback="";render()},"tool"));
  if(a!==null&&!fixed)add(tools,button("↶ 1つめを かえる",()=>{state.first=null;state.second=null;state.win=false;state.feedback="";render()},"tool"));
  if(b!==null&&!state.win)add(tools,button("↶ 2つめを はずす",()=>{state.second=null;state.feedback="";render()},"tool"));
  body.append(tools);
  const chapter=state.free?"じゆうに ためそう":CHAPTERS[st.chapter].name;
  return gameShell(chapter,state.free?"2つの タイルで つくろう":st.name,prompt,body);
}
function render(){
  const kind=state.screen==="stage"?STAGES[state.index].kind:null;
  ROOT.replaceChildren(state.screen==="home"?home():kind==="compare"||kind==="classify"?introGame():["capacity","length","area"].includes(kind)?measurementGame():kind==="count"?counting():kind==="quantity"?quantityGame():pairGame());
}
render();
if("serviceWorker" in navigator && location.protocol==="https:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(()=>{}));
}
})();
