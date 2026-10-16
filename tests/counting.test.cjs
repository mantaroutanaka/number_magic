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
test("each count from 1 to 10 is followed by its quantity choice",()=>{
  assert.equal(stages.length,35);
  for(let n=1;n<=10;n++){
    assert.equal(stages[(n-1)*2].kind,"count");
    assert.equal(stages[(n-1)*2].n,n);
    assert.equal(stages[(n-1)*2+1].kind,"quantity");
    assert.equal(stages[(n-1)*2+1].n,n);
    assert.equal(stages[(n-1)*2+1].avoidEmoji,stages[(n-1)*2].emoji);
  }
  assert.ok(stages.slice(20).every(st=>st.kind==="pair"));
});
const migrate=vm.runInNewContext(source.slice(source.indexOf("function migrateProgress"),source.indexOf("let progress="))+";migrateProgress",{STAGES:stages});
const plain=value=>JSON.parse(JSON.stringify(value));
test("legacy progress retains all 25 completions and opens new exercises",()=>{
  const old={done:Array.from({length:25},(_,i)=>i),last:5};
  const next=plain(migrate(old));
  assert.equal(next.version,3);
  assert.equal(next.done.length,25);
  assert.deepEqual(next.done.slice(0,10),[0,2,4,6,8,10,12,14,16,18]);
  assert.deepEqual(next.done.slice(10),Array.from({length:15},(_,i)=>i+20));
  assert.equal(next.last,10);
  assert.deepEqual(plain(migrate(next)),next,"migration is idempotent");
});
test("invalid saved progress is discarded without creating completions",()=>{
  assert.deepEqual(plain(migrate(null)),{version:3,done:[],last:0});
  assert.deepEqual(plain(migrate({done:[-1,25,"1",1,1],last:99})),{version:3,done:[2],last:0});
});

test("quantity choices do not repeat the previous animal or mix two fish types",()=>{
  for(const [avoidEmoji] of things)for(let n=1;n<=10;n++)for(let attempt=0;attempt<30;attempt++){
    const groups=generators.quantityGroups({n,avoidEmoji});
    const kind=emoji=>emoji==="🐟"||emoji==="🐠"?"fish":emoji;
    assert.ok(groups.every(g=>kind(g.emoji)!==kind(avoidEmoji)));
    assert.equal(new Set(groups.map(g=>kind(g.emoji))).size,3);
  }
});
