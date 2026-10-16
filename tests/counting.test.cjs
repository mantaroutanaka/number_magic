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
const makeScene=vm.runInNewContext(source.slice(begin,end)+";shuffledObjects",{Math:math});
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
