const assert=require('node:assert/strict'),{create}=require('./clock.cjs'),{pack}=require('./pack.cjs'),{validate}=require('./validate.cjs');
let checks=0;function equal(a,b){assert.deepEqual(a,b);checks++;}
const c=create({idleMs:3600000});c.update(1000,{owner:'a',activity:'textbook:math1',visible:true,focused:true});for(let t=2000;t<=622000;t+=1000)c.tick(t);
const batches=pack(c.snapshot().segments,{uid:'a',origin:1000});equal(batches.map(x=>x.length),[60,60,5]);
equal(batches.flat().reduce((n,s)=>n+s.endOffset-s.startOffset,0),621000);
equal(batches.flat().every(s=>s.endOffset-s.startOffset<=5000),true);
const id='00000000-0000-4000-8000-000000000001',context={session:{id,startedAt:100000},now:800000,catalog:[{id:'textbook:math1',subject:'数学',kind:'textbook'}]};
for(const s of batches.flat())validate({...s,id,sessionId:id},context);checks++;
const gap=pack([{owner:'a',activity:'question:u',start:1000,end:3000},{owner:'a',activity:'question:u',start:5000,end:6000}],{uid:'a',origin:1000});equal(gap.flat().reduce((n,s)=>n+s.endOffset-s.startOffset,0),3000);
assert.throws(()=>pack(c.snapshot().segments,{uid:'b',origin:1000}));checks++;
assert.throws(()=>pack([{owner:'a',activity:'x',start:0,end:15000000}],{uid:'a',origin:0}));checks++;
equal(pack([],{uid:'a',origin:0}),[]);
console.log('Timeline packing candidate: '+checks+' checks passed; real clock-to-validator compatibility, bounded 60-span batches, gap preservation and owner isolation; no network');
