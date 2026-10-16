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
for (let n = 1; n <= 10; n++) STAGES.push({kind:"count",n:n,emoji:COUNT_THINGS[n-1][0],thing:COUNT_THINGS[n-1][1],chapter:0,name:n+"こ を みつけよう"});
for (let a = 1; a <= 4; a++) STAGES.push({kind:"pair",target:5,a:a,chapter:1,name:a+"と いくつで 5？"});
STAGES.push({kind:"pair",target:5,a:null,chapter:1,name:"じぶんで 5を つくろう"});
for (let extra = 1; extra <= 5; extra++) STAGES.push({kind:"pair",target:5+extra,a:5,chapter:2,name:"5と いくつで "+(5+extra)+"？"});
for (let a = 1; a <= 5; a++) STAGES.push({kind:"pair",target:10,a:a,chapter:3,name:a+"と いくつで 10？"});
const CHAPTERS = [
  {name:"① かずを かぞえよう",sub:"え → こえ → すうじ → タイル",icon:"🔎"},
  {name:"② 5を つくろう",sub:"2つの タイルで 5を つくる",icon:"🌱"},
  {name:"③ 5から ふやそう",sub:"5と あといくつで 6〜10？",icon:"🌈"},
  {name:"④ 10を つくろう",sub:"2つの タイルで 10を つくる",icon:"🏰"}
];
const KEY = "number-magic-learning-v2";
let progress = {done:[],last:0};
try {
  const p=JSON.parse(localStorage.getItem(KEY)||"null");
  if(p&&Array.isArray(p.done)) progress={done:p.done.filter(n=>Number.isInteger(n)&&n>=0&&n<STAGES.length),last:Number.isInteger(p.last)?p.last:0};
} catch(e) {}
const state={screen:"home",index:0,found:[],first:null,second:null,feedback:"",win:false,free:false,goal:5};
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
function goHome(){state.screen="home";render();window.scrollTo(0,0)}
function enter(i){
  if(i<0||i>=STAGES.length)return;
  state.screen="stage";state.index=i;state.found=[];state.first=null;state.second=null;state.feedback="";state.win=false;state.free=false;
  progress.last=i;save();render();window.scrollTo(0,0);
}
function enterFree(){
  state.screen="free";state.free=true;state.first=null;state.second=null;state.goal=5;state.feedback="";state.win=false;
  render();window.scrollTo(0,0);
}
function finish(){
  state.win=true;
  if(!state.free&&!progress.done.includes(state.index)){progress.done.push(state.index);save()}
}
function unlocked(){for(let i=0;i<STAGES.length;i++)if(!progress.done.includes(i))return i;return STAGES.length-1}
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
  add(road,el("strong","","この じゅんばんで あそぶよ"),el("p","","① えを かぞえる → ② 5を つくる → ③ 5から ふやす → ④ 10を つくる"));
  wrap.append(road);
  CHAPTERS.forEach((ch,k)=>{
    const group=el("section","chapter");
    const heading=el("div","section-heading");
    add(heading,el("h2","",ch.icon+" "+ch.name),el("span","",ch.sub));group.append(heading);
    const grid=el("div","stage-grid");
    STAGES.forEach((st,i)=>{
      if(st.chapter!==k)return;
      const locked=i>unlocked()&&!progress.done.includes(i);
      const b=button(" ",()=>enter(i),"stage-card"+(locked?" locked":""),locked);
      b.textContent="";
      add(b,el("span","num",progress.done.includes(i)?"⭐ "+(i+1):"♧ "+(i+1)),el("span","title",st.name),el("span","mini",locked?"🔒 じゅんばんに あそぼう":progress.done.includes(i)?"もういちど あそべる":"タップして あそぶ"));
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
function shuffledObjects(stage){
  const arr=[];
  for(let i=0;i<stage.n;i++)arr.push({id:"t"+i,emoji:stage.emoji,target:true});
  const others=["🌼","🪨","🌲","⭐","🍄","🌷","🦀","🐌"];
  for(let i=0;i<(stage.n<=3?4:5);i++)arr.push({id:"d"+i,emoji:others[(i+stage.n)%others.length],target:false});
  return arr.map((v,i)=>({v:v,sort:Math.sin((i+1)*91.37+stage.n*13.3)})).sort((a,b)=>a.sort-b.sort).map(x=>x.v);
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
  const items=el("div","scene-grid");
  shuffledObjects(st).forEach(obj=>{
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
  add(tools,button("⟳ もういちど かぞえる",()=>{state.found=[];state.win=false;state.feedback="";render()},"tool"));
  body.append(tools);if(feedback())body.append(feedback());
  return gameShell(CHAPTERS[0].name,st.name,st.thing+" を みつけて、1こずつ かぞえよう。",body);
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
  if(st.chapter===2&&!state.free){
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
  if(st.chapter===2&&!state.free)base.append(el("div","five-explainer","🔵 まず 5こ。そこから "+(st.target-5)+"こ ふえると "+st.target+"こ。"));
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
  ROOT.replaceChildren(state.screen==="home"?home():state.screen==="stage"&&STAGES[state.index].kind==="count"?counting():pairGame());
}
render();
if("serviceWorker" in navigator && location.protocol==="https:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(()=>{}));
}
})();