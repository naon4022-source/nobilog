'use strict';
const assert=require('node:assert/strict'),{create}=require('./month.cjs');
const catalog=[{id:'math',subject:'数学',kind:'textbook'},{id:'english',subject:'英語',kind:'question'}],
 t=Date.parse('2026-10-01T00:00:00+09:00'),now=t+86400000;
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
async function scan(inMonth){
 let page=0,peak=process.memoryUsage().heapUsed;
 const model=create({same:()=>true,ready:()=>true,catalog,request:async()=>{
  const offset=page++*200;
  const items=Array.from({length:200},(_,i)=>{
   const k=offset+i,id='00000000-0000-4000-8000-'+String(k+1).padStart(12,'0'),english=k%2===1,start=inMonth?t:t-2*86400000,acceptedAt=inMonth?now-(english?0:1):start+5000;
   return {id,acceptedAt,spans:Array.from({length:60},(_,j)=>({id:id+':'+j,subject:english?'英語':'数学',kind:english?'question':'textbook',activity:english?'english':'math',start,end:start+5000,acceptedAt}))};
  });
  peak=Math.max(peak,process.memoryUsage().heapUsed);
  return {items,next:page===500?null:items.at(-1).id,serverTime:now};
 }});
 const result=await model.load('2026-10');model.dispose();
 eq(page,500);eq(result.records,100000);eq(result.pages,500);eq(result.complete,true);
 eq(result.matchedSpans,inMonth?6000000:0);eq(result.retainedIntervals,inMonth?2:0);eq(result.totalMs,inMonth?5000:0);eq(result.totals['英語'],inMonth?5000:0);eq(result.totals['数学'],0);
 return Math.round(peak/1048576);
}
(async()=>{const outside=await scan(false),duplicate=await scan(true);console.log(`Timeline maximum-history: ${n} checks passed; 6000000 out-of-month and 6000000 identical/overlapping spans, 500 pages each; sampled heap ${outside}/${duplicate} MiB; synthetic only`);})().catch(error=>{console.error(error);process.exitCode=1;});
