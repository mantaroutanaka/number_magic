/* Run with: node --test tests/counting.test.cjs */
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../game-v2.js"),"utf8");
// Exercise the production scene generator without adding browser test hooks.
const begin=source.indexOf("function shuffle(");
const end=source.indexOf("function resetCounting(",begin);
assert.ok(begin>=0&&end>begin,"scene generator boundaries exist");
let seed=20261016;
const math=Object.create(Math);
math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const things=vm.runInNewContext(source.slice(source.indexOf("const COUNT_THINGS"),source.indexOf("const STAGES"))+";COUNT_THINGS");
const generators=vm.runInNewContext(source.slice(begin,end)+";({shuffledObjects,quantityGroups})",{Math:math,COUNT_THINGS:things});
const makeScene=generators.shuffledObjects;
for(let n=1;n<=10;n++)test(n+" objects: frequency cannot uniquely identify the target",()=>{
  const layouts=new Set(),decoyTypes=new Set();
  for(let attempt=0;attempt<1000;attempt++){
    const objects=makeScene({n,emoji:"🐢"});
    const counts=new Map();
    for(const obj of objects)counts.set(obj.emoji,(counts.get(obj.emoji)||0)+1);
    assert.equal(objects.filter(o=>o.target).length,n);
    assert.equal(counts.get("🐢"),n);
    assert.equal(new Set(objects.map(o=>o.id)).size,objects.length);
    assert.ok(objects.every(o=>o.target===(o.emoji==="🐢")));
    const decoys=[...counts].filter(([emoji])=>emoji!=="🐢");
    assert.ok(decoys.some(([,count])=>count===n),"target frequency is shared");
    assert.ok(decoys.filter(([,count])=>count>=2).length>=2,"two repeated decoy categories");
    if(n>=2)assert.ok(decoys.every(([,count])=>count>=2),"no singleton decoys");
    assert.ok(objects.length<=30,"keep scenes manageable on touchscreens");
    layouts.add(objects.map(o=>o.emoji).join(""));
    decoys.forEach(([emoji])=>decoyTypes.add(emoji));
  }
  assert.ok(layouts.size>1,"layout varies across attempts");
  assert.ok(decoyTypes.size>3,"distractor identities vary");
});

test("intro games allow retries, save completion, and lead into original stages",()=>{
  class Node{
    constructor(){this.children=[];this.style={};this.dataset={};this.textContent="";}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=items;}
    setAttribute(){}
    addEventListener(){}
  }
  const root=new Node();
  const context={document:{getElementById:()=>root,createElement:()=>new Node()},window:{scrollTo(){}},localStorage:{getItem:()=>null,setItem(){}},navigator:{},location:{protocol:"http:"},clearTimeout,setTimeout};
  vm.createContext(context);
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, "globalThis.game={enter,chooseIntro,state,progress,STAGES,unlocked};})();"),context);
  const game=context.game;
  for(let i=0;i<2;i++){
    game.enter(i);
    const intro=game.state.intro,answer=intro.answer;
    game.chooseIntro((answer+1)%(i===0?2:3));
    assert.equal(game.state.win,false);
    assert.equal(game.state.intro,intro,"wrong answer preserves task");
    game.chooseIntro(answer);
    assert.equal(game.state.win,true);
    assert.ok(game.progress.done.includes(game.STAGES[i].id));
    game.chooseIntro(answer);
    assert.equal(game.progress.done.length,i+1);
  }
  assert.equal(game.unlocked(),2);
  game.enter(2);
  assert.equal(game.STAGES[game.state.index].id,"count-1");
});
test("intro generators vary answer positions and keep one clear answer",()=>{
  const make=vm.runInNewContext(source.slice(source.indexOf("function makeIntro("),source.indexOf("function chooseIntro("))+";makeIntro",{shuffle:items=>items.slice().sort(()=>Math.random()-.5),COUNT_THINGS:things});
  const sides=new Set(),positions=new Set();
  for(let i=0;i<500;i++){
    const comparison=make("compare");
    assert.equal(comparison.groups[comparison.answer].count,4);
    assert.equal(comparison.groups.filter(g=>g.count===4).length,1);
    sides.add(comparison.answer);
    const friends=make("classify");
    assert.equal(friends.choices[friends.answer],friends.family.answer);
    assert.equal(new Set(friends.choices).size,3);
    positions.add(friends.answer);
  }
  assert.equal(sides.size,2);
  assert.equal(positions.size,3);
});


for(let n=1;n<=10;n++)test(n+" quantity choice: one answer and varied pictures",()=>{
  const positions=new Set(),answers=new Set(),ranks=new Set();
  for(let attempt=0;attempt<1000;attempt++){
    const groups=generators.quantityGroups({n,avoidEmoji:"🐢"});
    assert.equal(groups.length,3);
    assert.equal(groups.filter(g=>g.count===n).length,1,"exactly one correct category");
    assert.equal(new Set(groups.map(g=>g.count)).size,3,"distinct counts");
    assert.equal(new Set(groups.map(g=>g.emoji)).size,3,"distinct pictures");
    assert.equal(new Set(groups.map(g=>g.id)).size,3,"unique group IDs");
    assert.ok(groups.every(g=>g.emoji!=="🐢"&&g.count>=1&&g.count<=10));
    positions.add(groups.findIndex(g=>g.count===n));
    ranks.add(groups.filter(g=>g.count<n).length);
    answers.add(groups.find(g=>g.count===n).emoji);
  }
  assert.equal(positions.size,3,"answer position varies");
  if(n>=3&&n<=8)assert.equal(ranks.size,3,"answer is not always the middle-sized group");
  assert.ok(answers.size>3,"answer picture varies");
});
const stages=vm.runInNewContext(source.slice(source.indexOf("const COUNT_THINGS"),source.indexOf("const CHAPTERS"))+";STAGES");
const expectedIds=["compare-more","find-friends"];
for(let n=1;n<=5;n++)expectedIds.push("count-"+n,"quantity-"+n);
for(let a=1;a<=4;a++)expectedIds.push("make5-"+a);
expectedIds.push("make5-free");
for(let n=6;n<=10;n++)expectedIds.push("count-"+n,"quantity-"+n,"fiveplus-"+n);
for(let a=1;a<=5;a++)expectedIds.push("make10-"+a);
const plain=value=>JSON.parse(JSON.stringify(value));
test("5 composition follows quantity 5; each 6–10 is counted, chosen, then built from 5",()=>{
  assert.deepEqual(plain(stages.map(st=>st.id)),expectedIds);
  assert.equal(new Set(stages.map(st=>st.id)).size,37);
  for(let n=1;n<=10;n++){
    const i=stages.findIndex(st=>st.id==="count-"+n);
    assert.equal(stages[i].kind,"count");
    assert.equal(stages[i+1].id,"quantity-"+n);
    assert.equal(stages[i+1].avoidEmoji,stages[i].emoji);
    if(n>=6){assert.equal(stages[i+2].id,"fiveplus-"+n);assert.equal(stages[i+2].a,5);assert.equal(stages[i+2].target,n);}
  }
  assert.ok(stages.every((st,i)=>i===0||st.chapter>=stages[i-1].chapter),"map chapter order matches play order");
});
const migrate=vm.runInNewContext(source.slice(source.indexOf("function migrateProgress"),source.indexOf("let progress="))+";migrateProgress",{STAGES:stages});
const oldIds=[];
for(let n=1;n<=10;n++)oldIds.push("count-"+n,"quantity-"+n);
for(let a=1;a<=4;a++)oldIds.push("make5-"+a);
oldIds.push("make5-free");
for(let n=6;n<=10;n++)oldIds.push("fiveplus-"+n);
for(let a=1;a<=5;a++)oldIds.push("make10-"+a);
test("all previous 35-stage positions migrate by problem identity",()=>{
  for(let i=0;i<35;i++){
    const next=plain(migrate({version:3,done:[i],last:i}));
    assert.deepEqual(next,{version:4,done:[oldIds[i]],last:oldIds[i]});
    assert.deepEqual(plain(migrate(next)),next,"ID-based progress is stable");
  }
  const all=plain(migrate({version:3,done:Array.from({length:35},(_,i)=>i),last:34}));
  assert.deepEqual(all.done,oldIds);
  assert.equal(all.done.length,35);
});
test("older 25-stage completions retain identity without completing new choices",()=>{
  const old={done:Array.from({length:25},(_,i)=>i),last:5};
  const next=plain(migrate(old));
  assert.equal(next.version,4);
  assert.equal(next.done.length,25);
  assert.deepEqual(next.done.slice(0,10),Array.from({length:10},(_,i)=>"count-"+(i+1)));
  assert.deepEqual(next.done.slice(10),oldIds.slice(20));
  assert.equal(next.last,"count-6");
  assert.deepEqual(plain(migrate(next)),next);
});
test("invalid saved progress is discarded without creating completions",()=>{
  assert.deepEqual(plain(migrate(null)),{version:4,done:[],last:"compare-more"});
  assert.deepEqual(plain(migrate({done:[-1,25,"1",1,1],last:99})),{version:4,done:["count-2"],last:"compare-more"});
  assert.deepEqual(plain(migrate({version:4,done:[0,"count-1","missing","count-1"],last:"missing"})),{version:4,done:["count-1"],last:"compare-more"});
});

test("quantity choices do not repeat the previous animal or mix two fish types",()=>{
  for(const [avoidEmoji] of things)for(let n=1;n<=10;n++)for(let attempt=0;attempt<30;attempt++){
    const groups=generators.quantityGroups({n,avoidEmoji});
    const kind=emoji=>emoji==="🐟"||emoji==="🐠"?"fish":emoji;
    assert.ok(groups.every(g=>kind(g.emoji)!==kind(avoidEmoji)));
    assert.equal(new Set(groups.map(g=>kind(g.emoji))).size,3);
  }
});

