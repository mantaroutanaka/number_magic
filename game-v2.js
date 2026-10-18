/* 数の魔法 — 量から数へ / 2026 */
(() => {
"use strict";
const ROOT = document.getElementById("app");
const READ = ["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう","じゅう","じゅういち","じゅうに","じゅうさん","じゅうよん","じゅうご","じゅうろく","じゅうなな","じゅうはち","じゅうきゅう","にじゅう"];
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
STAGES.push(
  {id:"ordinal-directions",kind:"ordinal",mode:"directions",chapter:4,name:"なんばんめかな"},
  {id:"ordinal-cardinality",kind:"ordinal",mode:"cardinality",chapter:4,name:"いくつと なんばんめ"},
  {id:"ordinal-grid",kind:"ordinal",mode:"grid",chapter:4,name:"たて・よこの ばしょ"}
);
STAGES.forEach(stage=>stage.chapter++);
[
  ["count","20まで かぞえよう"],
  ["read","11〜20を よもう"],
  ["place","じゅうの くらい・いちの くらい"],
  ["compare","おおきい かず・ちいさい かず"],
  ["sequence","20までの かずの ならび"],
  ["parts","かずを たしたり ひいたり"],
  ["calculate","20までの たしざん・ひきざん"]
].forEach(([mode,name])=>STAGES.push({id:"twenty-"+mode,kind:"twenty",mode,chapter:6,name}));
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
  {name:"④ 10を つくろう",sub:"2つの タイルで 10を つくる",icon:"🏰"},
  {name:"⑤ なんばんめかな",sub:"むき・じゅんばん・たてと よこの ばしょ",icon:"📍"},
  {name:"⑥ 10より おおきい かずを かぞえよう",sub:"10の まとまり → よみかき → くらい → くらべる・ならべる → たす・ひく",icon:"🧮"}
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
  state.ordinal=STAGES[i].kind==="ordinal"?makeOrdinal(STAGES[i].mode):null;
  state.twenty=STAGES[i].kind==="twenty"?makeTwenty(STAGES[i].mode):null;
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
  add(road,el("strong","","この じゅんばんで あそぶよ"),el("p","","くらべる・なかまわけ → ① 1〜5を かぞえる → ② 5を つくる → ③ 6〜10を かぞえて 5から ふやす → ④ 10を つくる → ⑤ なんばんめ・ばしょ → ⑥ 20までの かず"));
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

function calculationStory(problem){
  if(problem.op==="+")return "りんごが "+problem.a+"こ あります。"+problem.b+"こ もらいました。あわせて なんこ？";
  return "りんごが "+problem.a+"こ あります。"+problem.b+"こ わたしました。のこりは なんこ？";
}
function calculationStrategy(problem){
  const {a,b,op,result}=problem,ones=a%10;
  if(op==="+"){
    if(a===10&&b===10)return "10の まとまりが 1こと 1こで 2こ。だから 20だね。";
    if(a>=10&&b<10&&ones+b<10)return a+"を 10と "+ones+"に わけるよ。ばらの "+ones+"と "+b+"で "+(ones+b)+"。10と あわせて "+result+"だね。";
    if(a>=10&&b<10&&ones+b===10)return "ばらの "+ones+"と "+b+"で 10。もとの 10と あわせて、10の まとまりが 2こで 20だね。";
    return a+"と "+b+"を あわせると "+result+"。10の まとまりと ばらで たしかめよう。";
  }
  if(b===10)return a+"は 10と "+ones+"。10の まとまりを 1こ とると、"+result+"が のこるね。";
  if(a===20&&b<10)return "20は 10が 2こ。ひとまとまりを ばらの 10こに もどして、"+b+"こ とると "+(10-b)+"こ。のこした 10と あわせて "+result+"だね。";
  if(a>=10&&b<=ones)return a+"は 10と "+ones+"。ばらの "+ones+"から "+b+"を とると "+(ones-b)+"。10と あわせて "+result+"だね。";
  return a+"から "+b+"を とると "+result+"。タイルの のこりを たしかめよう。";
}
function numberLine(selected){
  const box=el("section","learning-number-line");
  add(box,el("strong","","かずの せんで たしかめよう"),el("p","","めもりは おなじ はば。みぎへ 1ずつ おおきくなるよ。"));
  const line=el("div","number-line-ticks");
  for(let n=10;n<=20;n++)line.append(el("span",n===selected?"chosen":"",n));
  box.append(line);return box;
}


function makeTwenty(mode){
  const numbers=Array.from({length:10},(_,i)=>i+11);
  let rounds;
  if(["count","read","place"].includes(mode)){
    rounds=numbers.map(n=>({n,answer:n,prompt:mode==="count"?"えを ぜんぶ かぞえて、かずを えらぼう。":mode==="read"?"「"+READ[n]+"」を すうじで あらわすと？":"10の まとまりと ばらを みて、すうじを つくろう。"}));
  }else if(mode==="compare"){
    rounds=[[11,14,true],[19,16,false],[20,12,true],[17,18,false],[13,20,false],[15,11,true]].map(([a,b,greater])=>({a,b,greater,answer:greater?Math.max(a,b):Math.min(a,b),prompt:(greater?"おおきい":"ちいさい")+" かずを えらぼう。"}));
  }else if(mode==="sequence"){
    rounds=[
      {series:[10,11,12,13,14],hole:2},
      {series:[14,15,16,17,18],hole:3},
      {series:[16,17,18,19,20],hole:4},
      {series:[20,19,18,17,16],hole:2},
      {series:[15,14,13,12,11],hole:3}
    ].map(problem=>({...problem,answer:problem.series[problem.hole],prompt:"□に はいる かずは？ "+(problem.series[0]<problem.series[1]?"1ずつ ふえるよ。":"1ずつ へるよ。")}));
  }else{
    const calculations=mode==="parts"
      ?[[10,"+",7,"b"],[12,"+",3,"a"],[18,"-",3,"b"],[20,"-",6,"result"],[10,"+",10,"b"],[16,"-",10,"result"]]
      :[[12,"+",3,"result"],[16,"+",2,"result"],[18,"+",2,"result"],[15,"-",3,"result"],[19,"-",4,"result"],[20,"-",6,"result"],[10,"+",10,"result"],[18,"-",10,"result"]];
    rounds=calculations.map(([a,op,b,missing])=>{
      const result=op==="+"?a+b:a-b;
      const answer=missing==="a"?a:missing==="b"?b:result;
      const show=value=>String(value),symbol=op==="+"?"＋":"−";
      const equation=(missing==="a"?"□":show(a))+" "+symbol+" "+(missing==="b"?"□":show(b))+" ＝ "+(missing==="result"?"□":show(result));
      const choices=shuffle([answer,...shuffle(Array.from({length:21},(_,i)=>i).filter(value=>value!==answer&&Math.abs(value-answer)<=3)).slice(0,3)]);
      return {a,b,op,result,missing,answer,equation,choices,prompt:mode==="parts"?"□に はいる かずを えらぼう。":"タイルで たしかめて、こたえを えらぼう。"};
    });
  }
  return {mode,rounds,round:0,solved:false,tapped:[],digits:[null,null],groupSize:1};
}
function tapTwenty(index){
  const task=state.twenty,problem=task.rounds[task.round];
  if(task.mode!=="count"||task.solved||!Number.isInteger(index)||index<0||index>=problem.n||task.tapped.includes(index))return;
  task.tapped.push(index);state.feedback="";speak(READ[task.tapped.length]);render();
}
function setTwentyGroupSize(size){
  const task=state.twenty;
  if(task.mode!=="count"||task.solved||![1,2,5].includes(size))return;
  task.groupSize=size;state.feedback="";render();
}
function tapTwentyGroup(start){
  const task=state.twenty,problem=task.rounds[task.round],size=task.groupSize;
  if(task.mode!=="count"||task.solved||!Number.isInteger(start)||start<0||start>=problem.n||start%size!==0)return;
  const remaining=Array.from({length:Math.min(size,problem.n-start)},(_,i)=>start+i).filter(index=>!task.tapped.includes(index));
  if(!remaining.length)return;
  task.tapped.push(...remaining);state.feedback="";speak(READ[task.tapped.length]);render();
}
function setTwentyDigit(place,digit){
  const task=state.twenty;
  if(task.mode!=="place"||task.solved||![0,1].includes(place)||!Number.isInteger(digit)||digit<0||digit>9)return;
  task.digits[place]=digit;state.feedback="";render();
}
function chooseTwenty(answer){
  const task=state.twenty,problem=task.rounds[task.round];
  if(task.solved||state.win||!Number.isInteger(answer)||answer<0||answer>(task.mode==="place"?99:20))return;
  if(task.mode==="count"&&task.tapped.length!==problem.n)return;
  if(task.mode==="place"&&(task.digits.some(digit=>digit===null)||answer!==task.digits[0]*10+task.digits[1]))return;
  state.selected=answer;
  if(answer===problem.answer){
    task.solved=true;state.feedback="";
    if(task.round===task.rounds.length-1)finish();
  }else state.feedback=task.mode==="place"?"ひだりは 10の まとまりの かず、みぎは ばらの かず。20の ばらは 0こだよ。":"10の まとまりと ばらに わけて、もういちど たしかめよう。";
  render();
}
function nextTwenty(){
  const task=state.twenty;
  if(!task.solved||task.round>=task.rounds.length-1)return;
  task.round++;task.solved=false;task.tapped=[];task.digits=[null,null];state.selected=null;state.feedback="";render();
}
function baseTen(n){
  const wrap=el("section","base-ten");
  const tens=Math.floor(n/10),ones=n%10;
  wrap.setAttribute("role","img");wrap.setAttribute("aria-label","10の まとまり "+tens+"こ、ばら "+ones+"こ");
  const bundles=el("div","ten-bundles");
  for(let t=0;t<tens;t++){
    const bundle=el("div","ten-bundle");
    for(let i=0;i<10;i++)bundle.append(el("span","base-unit"));
    bundles.append(bundle);
  }
  const singles=el("div","ten-singles");
  for(let i=0;i<ones;i++)singles.append(el("span","base-unit"));
  add(wrap,el("strong","","10の まとまり "+tens+"こ"),bundles,el("strong","","ばら "+ones+"こ"),singles);
  return wrap;
}
function arithmeticTiles(problem,reveal){
  const panel=el("section","arithmetic-tiles");
  panel.append(el("p","",problem.op==="+"?"あおに きいろを くっつけよう。10こで ひとまとまり。":"あおから ×の ぶんを とるよ。のこりを かぞえよう。"));
  const grid=el("div","arithmetic-grid");
  const total=problem.op==="+"?problem.result:problem.a;
  for(let i=0;i<20;i++){
    const present=i<total,removed=problem.op==="-"&&i>=problem.result&&present;
    const cell=el("span","arithmetic-unit"+(present?(removed?" removed":problem.op==="+"&&i>=problem.a?" added":" filled"):""),removed?"×":"");
    grid.append(cell);
  }
  panel.append(grid);
  if(reveal)panel.append(el("strong","",problem.a+(problem.op==="+"?" ＋ ":" − ")+problem.b+" ＝ "+problem.result));
  return panel;
}
function twentyGame(){
  const st=STAGES[state.index],task=state.twenty,problem=task.rounds[task.round],mode=task.mode,body=el("div","");
  add(body,el("p","round-progress",(task.round+1)+" / "+task.rounds.length+" もん"),button("🔊 もんだいを きく",()=>speak((mode==="calculate"?calculationStory(problem)+" ":"")+problem.prompt+(problem.equation?" "+problem.equation.replace("□","しかく"):"")),"tool"));
  if(mode==="count"){
    const grouping=el("div","group-count-switch");
    [1,2,5].forEach(size=>{
      const b=button(size+"こずつ",()=>setTwentyGroupSize(size),"tool"+(task.groupSize===size?" active":""),task.solved);
      b.setAttribute("aria-pressed",String(task.groupSize===size));grouping.append(b);
    });
    body.append(grouping);
    const scene=el("div","twenty-scene"+(task.groupSize>1?" grouped":""));
    for(let i=0;i<problem.n;i+=task.groupSize){
      const indices=Array.from({length:Math.min(task.groupSize,problem.n-i)},(_,j)=>i+j);
      const remaining=indices.filter(index=>!task.tapped.includes(index)).length,done=remaining===0;
      const b=button("",()=>tapTwentyGroup(i),"twenty-object"+(task.groupSize>1?" twenty-group":"")+(done?" counted":""),done);
      const pictures=el("span","group-count-pictures");
      indices.forEach(index=>pictures.append(el("span",task.tapped.includes(index)?"already-counted":"","🍎")));
      b.append(pictures);
      if(task.groupSize>1)b.append(el("span","group-count-label",indices.length+"この まとまり"+(done?" ✓":"")));
      b.setAttribute("aria-label",done?"かぞえた まとまり":remaining+"この りんごを まとめて かぞえる");
      scene.append(b);
    }
    body.append(scene);body.append(baseTen(task.tapped.length));
    body.append(el("p","quantity-instruction",task.tapped.length===problem.n?"ぜんぶ かぞえたね。1こずつでも まとめても、ぜんぶの かずは おなじだよ。":task.groupSize===1?"りんごを 1こずつ タップしよう。10こ たまると まとまるよ。":task.groupSize+"こずつの まとまりを タップしよう。さいごの あまりも わすれずに。"));
  }else if(mode==="read"){
    body.append(el("div","twenty-reading","「"+READ[problem.n]+"」"));
    body.append(button("🔊 かずを きく",()=>speak(READ[problem.n]),"tool"));
    body.append(baseTen(problem.n));
  }else if(mode==="place"){
    body.append(baseTen(problem.n));
    const places=el("div","place-editor");
    ["十の位（じゅうの くらい）","一の位（いちの くらい）"].forEach((label,place)=>{
      const column=el("section","place-column");
      add(column,el("h2","",label),el("div","place-digit",task.digits[place]===null?"□":task.digits[place]));
      const keys=el("div","place-keys");
      for(let digit=0;digit<=9;digit++){
        const b=button(digit,()=>setTwentyDigit(place,digit),"tool"+(task.digits[place]===digit?" active":""),task.solved);
        b.setAttribute("aria-label",(place===0?"十の位":"一の位")+"を "+digit+"に する");keys.append(b);
      }
      column.append(keys);places.append(column);
    });
    body.append(places);
    body.append(button("この すうじで たしかめる",()=>chooseTwenty(task.digits[0]*10+task.digits[1]),"btn btn-primary quantity-check",task.solved||task.digits.some(digit=>digit===null)));
  }else if(mode==="compare"){
    body.append(el("p","quantity-instruction","じゅうの くらいが おなじなら、いちの くらいを くらべよう。"));
  }else if(mode==="sequence"){
    const series=el("div","number-series");
    problem.series.forEach((n,i)=>series.append(el("span",i===problem.hole?"series-hole":"",i===problem.hole&&!task.solved?"□":n)));
    body.append(series);
    body.append(numberLine(state.selected));
  }else{
    if(mode==="calculate")body.append(el("p","arithmetic-story",calculationStory(problem)));
    body.append(el("div","twenty-equation",problem.equation));
    body.append(arithmeticTiles(problem,task.solved));
  }
  if(mode!=="place"){
    const choices=mode==="compare"?[problem.a,problem.b]:problem.choices||Array.from({length:11},(_,i)=>i+10);
    const answers=el("div","twenty-answers");
    choices.forEach(answer=>{
      const b=button(answer,()=>chooseTwenty(answer),"tool"+(state.selected===answer?" active":""),task.solved||(mode==="count"&&task.tapped.length!==problem.n));
      b.setAttribute("aria-label",answer+"を えらぶ");answers.append(b);
    });body.append(answers);
  }
  if(state.feedback)body.append(feedback());
  if(task.solved){
    const note=el("section","set-explanation");
    let explanation;
    if(["count","read","place"].includes(mode)){
      const tens=Math.floor(problem.n/10),ones=problem.n%10;
      explanation=problem.n+"は「"+READ[problem.n]+"」。十の位は "+tens+"、一の位は "+ones+"。10が "+tens+"こ と、ばらが "+ones+"こ。";
      note.append(numberRead(problem.n,false));
    }else if(mode==="compare"){
      explanation=Math.max(problem.a,problem.b)+"は "+Math.min(problem.a,problem.b)+"より おおきいね。";
      add(note,el("strong","",problem.a),baseTen(problem.a),el("strong","",problem.b),baseTen(problem.b));
    }else if(mode==="sequence"){
      explanation=problem.series.join("、")+"。1ずつ "+(problem.series[0]<problem.series[1]?"ふえる":"へる")+" ならびだね。";
    }else{
      explanation=calculationStrategy(problem);
      note.append(baseTen(problem.result));
    }
    add(note,el("p","",explanation),button("🔊 たしかめる おはなし",()=>speak(explanation),"tool"));
    if(!state.win)note.append(button("つぎの もんだい →",nextTwenty,"btn btn-primary quantity-check"));
    body.append(note);
  }
  if(state.win)body.append(success(st.name+"、できたね！","10の まとまりで かんがえられたね。"));
  body.append(button("⟳ はじめから",()=>{state.twenty=makeTwenty(st.mode);state.selected=null;state.feedback="";state.win=false;render();},"tool"));
  return gameShell(CHAPTERS[st.chapter].name,st.name,problem.prompt,body);
}


function makeOrdinal(mode){
  let rounds;
  if(mode==="directions"){
    rounds=[
      {direction:"ひだり",n:7,rank:3},
      {direction:"みぎ",n:7,rank:2},
      {direction:"うえ",n:6,rank:4,vertical:true},
      {direction:"した",n:6,rank:2,vertical:true},
      {direction:"まえ",n:10,rank:4,queue:true},
      {direction:"うしろ",n:10,rank:3,queue:true}
    ].map(problem=>({...problem,type:"pick",answer:["みぎ","した","うしろ"].includes(problem.direction)?problem.n-problem.rank:problem.rank-1,prompt:problem.direction+"から "+problem.rank+"ばんめを えらぼう。"}));
  }else if(mode==="cardinality"){
    rounds=[
      {type:"number",n:7,prompt:"ぜんぶで いくつ あるかな？",answer:7,why:"「いくつ」は、ぜんぶの かず。7こ あるね。"},
      {type:"pick",n:7,direction:"ひだり",rank:4,prompt:"ひだりから 4ばんめを ひとつ えらぼう。",answer:3},
      {type:"number",n:7,marked:[0,1,2],prompt:"ひだりから 3こに しるしを つけたよ。しるしは いくつ？",answer:3,why:"「ひだりから 3こ」は、はしから 3こぶんの まとまりだね。"},
      {type:"number",n:7,marked:[2],prompt:"しるしが あるのは、ひだりから なんばんめ？",answer:3,why:"「3ばんめ」は、ひだりから かぞえた ばしょ。ひとつの ばしょを あらわすよ。"},
      {type:"number",n:7,marked:[2],prompt:"こんどは、しるしが ついた ものは いくつ？",answer:1,why:"ばしょは 3ばんめ。でも、しるしが ついた ものの かずは 1こだね。"}
    ];
  }else{
    rounds=[
      {rows:3,cols:3,row:2,col:3,fromRow:"うえ",fromCol:"ひだり"},
      {rows:3,cols:3,row:3,col:2,fromRow:"うえ",fromCol:"ひだり"},
      {rows:3,cols:4,row:2,col:1,fromRow:"した",fromCol:"みぎ"},
      {rows:3,cols:4,row:1,col:3,fromRow:"した",fromCol:"ひだり"}
    ].map(problem=>{
      const r=problem.fromRow==="うえ"?problem.row-1:problem.rows-problem.row;
      const c=problem.fromCol==="ひだり"?problem.col-1:problem.cols-problem.col;
      return {...problem,n:problem.rows*problem.cols,type:"grid",answer:r*problem.cols+c,prompt:problem.fromRow+"から "+problem.row+"ばんめ、"+problem.fromCol+"から "+problem.col+"ばんめの ばしょは？"};
    });
  }
  const pictures=["🐶","🐱","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐸"];
  rounds=rounds.map(problem=>({...problem,pictures:problem.type==="grid"?Array(problem.n).fill("🌼"):pictures.slice(0,problem.n)}));
  return {rounds,round:0,solved:false,mode};
}
function chooseOrdinal(answer){
  const task=state.ordinal,problem=task.rounds[task.round];
  if(state.win||task.solved||!Number.isInteger(answer)||answer<(problem.type==="number"?1:0)||answer>=(problem.type==="number"?11:problem.n))return;
  state.selected=answer;
  if(answer===problem.answer){
    state.feedback="";task.solved=true;
    if(task.round===task.rounds.length-1)finish();
  }else state.feedback=problem.type==="grid"?"たてと よこを、きかれた はしから べつべつに かぞえて みよう。":problem.type==="number"?"「いくつ」と「なんばんめ」、どちらを きかれているかな？":"かぞえはじめる はしを たしかめよう。そこを 1ばんめに するよ。";
  render();
}
function nextOrdinal(){
  const task=state.ordinal;
  if(!task.solved||task.round>=task.rounds.length-1)return;
  task.round++;task.solved=false;state.selected=null;state.feedback="";render();
}
function ordinalGame(){
  const st=STAGES[state.index],task=state.ordinal,problem=task.rounds[task.round],body=el("div","");
  add(body,el("p","round-progress",(task.round+1)+" / "+task.rounds.length+" もん"),button("🔊 もんだいを きく",()=>speak(problem.prompt),"tool"));
  const board=el("section","ordinal-board");
  board.append(el("p","ordinal-edge",problem.type==="grid"?"↑ うえ":problem.vertical?"↑ うえ":problem.queue?"まえ ←　　→ うしろ":"ひだり ←　　→ みぎ"));
  if(problem.type==="grid")board.append(el("p","ordinal-edge","ひだり ←　　→ みぎ"));
  const cells=el("div","ordinal-cells"+(problem.vertical?" vertical":"")+(problem.type==="grid"?" plane":""));
  cells.style.gridTemplateColumns="repeat("+(problem.type==="grid"?problem.cols:problem.vertical?1:problem.n)+",minmax(0,1fr))";
  for(let i=0;i<problem.n;i++){
    const marked=problem.marked&&problem.marked.includes(i);
    const cell=problem.type==="number"?el("div","ordinal-cell"):button("",()=>chooseOrdinal(i),"ordinal-cell"+(state.selected===i?" selected":""),task.solved);
    if(marked)cell.className+=" marked";
    cell.append(el("span","ordinal-picture",problem.pictures[i]));
    if(marked)cell.append(el("span","ordinal-mark","★"));
    if(problem.type!=="number"){cell.setAttribute("aria-label",problem.type==="grid"?"ばしょ "+(i+1)+"を えらぶ":problem.pictures[i]+"を えらぶ");cell.setAttribute("aria-pressed",String(state.selected===i));}
    if(task.solved&&problem.type==="pick"){
      const reverse=["みぎ","した","うしろ"].includes(problem.direction);
      cell.append(el("span","ordinal-index",(reverse?problem.n-i:i+1)+"ばん"));
    }
    if(task.solved&&problem.type==="grid"){
      const row=Math.floor(i/problem.cols),col=i%problem.cols;
      cell.append(el("span","ordinal-index",(problem.fromRow==="うえ"?row+1:problem.rows-row)+"・"+(problem.fromCol==="ひだり"?col+1:problem.cols-col)));
    }
    cells.append(cell);
  }
  board.append(cells);
  if(problem.vertical||problem.type==="grid")board.append(el("p","ordinal-edge","↓ した"));
  body.append(board);
  if(problem.type==="number"){
    const answers=el("div","ordinal-answers");
    for(let n=1;n<=10;n++){
      const b=button(n,()=>chooseOrdinal(n),"tool"+(state.selected===n?" selected":""),task.solved);
      b.setAttribute("aria-label",n+"を えらぶ");answers.append(b);
    }
    body.append(answers);
  }
  if(state.feedback)body.append(feedback());
  if(task.solved){
    const note=problem.why||(problem.type==="grid"?"たては "+problem.fromRow+"から "+problem.row+"ばんめ、よこは "+problem.fromCol+"から "+problem.col+"ばんめ。ふたつの てがかりで、ひとつの ばしょが きまるね。":problem.direction+"の はしを 1ばんめに して かぞえると、"+problem.rank+"ばんめだね。");
    const explanation=el("section","set-explanation");
    add(explanation,el("h2","","できたね！"),el("p","",note),button("🔊 たしかめる おはなし",()=>speak(note),"tool"));
    if(!state.win)explanation.append(button("つぎの もんだい →",nextOrdinal,"btn btn-primary quantity-check"));
    body.append(explanation);
  }
  if(state.win)body.append(success(st.name+"、できたね！","かずで じゅんばんや ばしょを あらわせたね。"));
  body.append(button("⟳ はじめから",()=>{state.ordinal=makeOrdinal(st.mode);state.selected=null;state.feedback="";state.win=false;render();},"tool"));
  return gameShell(CHAPTERS[st.chapter].name,st.name,problem.prompt,body);
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
  if(kind==="area"){
    panel.append(el("h3","","まず、かどを そろえて かさねよう"));
    const overlay=el("div","area-overlay");
    const maxWidth=Math.max(...problem.choices.map(item=>item.w)),maxHeight=Math.max(...problem.choices.map(item=>item.h));
    overlay.style.width=(maxWidth*22)+"px";overlay.style.height=(maxHeight*22)+"px";
    problem.choices.forEach((item,i)=>{
      const sheet=el("span","area-layer layer-"+i);
      sheet.style.width=(item.w*22)+"px";sheet.style.height=(item.h*22)+"px";overlay.append(sheet);
    });
    const [a,b]=problem.choices;
    const nested=(a.w<=b.w&&a.h<=b.h)||(b.w<=a.w&&b.h<=a.h);
    add(panel,el("p","","あは みどり、いは オレンジ。"),overlay,el("p","",nested?"ひとつの かみが もうひとつの なかに おさまるね。つつむ ほうが ひろいよ。":"どちらも はみだす ところが あるね。これだけでは きめられないから、おなじ ますの いくつぶんかで くらべよう。"));
  }
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
  ROOT.replaceChildren(state.screen==="home"?home():kind==="compare"||kind==="classify"?introGame():kind==="twenty"?twentyGame():kind==="ordinal"?ordinalGame():["capacity","length","area"].includes(kind)?measurementGame():kind==="count"?counting():kind==="quantity"?quantityGame():pairGame());
}
render();
if("serviceWorker" in navigator && location.protocol==="https:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(()=>{}));
}
})();
