'use strict';
const assert=require('node:assert/strict'),{create,bounds}=require('./month.cjs'),{aggregate}=require('./aggregate.cjs');
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;},reject=async f=>{await assert.rejects(f);n++;};
const ID=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0'),
 catalog=[{id:'math',kind:'textbook',subject:'数学'},{id:'english',kind:'question',subject:'英語'}],
 time=Date.parse('2026-10-01T00:00:00+09:00'),now=Date.parse('2026-11-01T00:00:00+09:00');
const row=(i,start,end,subject='数学',acceptedAt=now)=>({id:ID(i),acceptedAt,content:'private metadata must not be published',spans:[{id:ID(i)+':0',subject,kind:subject==='数学'?'textbook':'question',activity:subject==='数学'?'math':'english',start,end,acceptedAt}]});
let rows=[],actor=true,connected=true,failPage=-1,pause=null,calls=0;
const month=create({same:()=>actor,ready:()=>connected,catalog,request:async path=>{
 const after=path.includes('?')?new URL('http://fixture'+path).searchParams.get('cursor'):null;
 const offset=after?rows.findIndex(x=>x.id===after)+1:0;calls++;
 if(pause)await pause;if(offset/200===failPage)throw Error('synthetic private error');
 const items=rows.slice(offset,offset+200);return {items,next:offset+200<rows.length?items.at(-1).id:null,serverTime:now};
}});
(async()=>{
 eq(bounds('2026-10'),{start:time,end:now});
 await reject(()=>month.load('2026-13'));await reject(()=>month.load('bad'));eq(calls,0);
 let r=await month.load('2026-10');eq(Object.keys(r.days).length,31);eq(r.totalMs,0);eq(r.complete,true);
 rows=[row(1,time-1000,time+1000),row(2,time,time+1000,'英語',now+1)];
 // A future acceptedAt is rejected even when its span is in the selected month.
 await reject(()=>month.load('2026-10'));eq(month.state().snapshot.totalMs,0);
 rows[1].acceptedAt=now;rows[1].spans[0].acceptedAt=now;
 r=await month.load('2026-10');eq(r.totalMs,1000);eq(r.totals['数学'],1000);eq(r.totals['英語'],0); // fixed ID wins a tie
 rows[1].acceptedAt=now-1;rows[1].spans[0].acceptedAt=now-1;
 r=await month.load('2026-10');eq(r.totals['数学'],1000);
 rows=[row(1,time,time+1000,'数学',now-1),...Array.from({length:199},(_,i)=>row(i+2,time+5000+i*5000,time+10000+i*5000)),row(201,time,time+1000,'英語')];
 r=await month.load('2026-10');eq(r.pages,2);eq(r.totalMs,996000);eq(r.totals['英語'],1000);eq(r.totals['数学'],995000);
 const saved=JSON.stringify(r);failPage=1;await reject(()=>month.load('2026-10'));eq(JSON.stringify(month.state().snapshot),saved);eq(month.state().error.includes('private'),false);failPage=-1;
 let release;pause=new Promise(resolve=>{release=resolve;});const pending=month.load('2026-10');await reject(()=>month.load('2026-10'));eq(JSON.stringify(month.state().snapshot),saved);actor=false;release();pause=null;await reject(()=>pending);eq(month.state().snapshot,null);actor=true;
 rows=Array.from({length:1000},(_,i)=>{const r=row(i+1,time+i*250000,time+i*250000+5000);r.spans=Array.from({length:50},(_,j)=>({...r.spans[0],id:r.id+':'+j,start:time+(i*50+j)*5000,end:time+(i*50+j+1)*5000}));return r;});
 r=await month.load('2026-10');eq(r.records,1000);eq(r.matchedSpans,50000);eq(r.pages,5);eq(r.totalMs,250000000);eq(r.totals['数学'],r.totalMs);eq(JSON.stringify(r).includes('private metadata'),false);
 r.days['2026-10-01']['数学']=99;eq(month.state().snapshot.days['2026-10-01']['数学'],86400000);
 rows=[];r=await month.load('2024-02');eq(Object.keys(r.days).length,29);eq(r.totalMs,0);
 connected=false;await reject(()=>month.load('2026-10'));eq(month.state().snapshot.month,'2024-02');connected=true;
 month.dispose();await reject(()=>month.load('2026-10'));eq(month.state().snapshot,null);
 assert.throws(()=>aggregate([],{maxRecords:6000001}));n++;
 console.log(`Timeline month: ${n} checks passed; full-page publication, 50000 spans, cross-page overlap, JST clipping, leap month, owner changes and failure retention; no network`);
})().catch(error=>{console.error(error);process.exitCode=1;});
