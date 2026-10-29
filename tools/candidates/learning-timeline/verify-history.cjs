'use strict';
const assert=require('node:assert/strict'),{create}=require('./history.cjs');
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;},reject=async f=>{await assert.rejects(f);checks++;};
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),catalog=[{id:'textbook:math1',subject:'数学',kind:'textbook'}];
const row=n=>({id:id(n),acceptedAt:1000,content:'must not escape',spans:[{id:id(n)+':0',activity:'textbook:math1',kind:'textbook',subject:'数学',start:0,end:1000,acceptedAt:1000}]}),page=(items,next=null)=>({items,next,serverTime:2000});
(async()=>{
 let actor=true,ready=true,reply=page([]),calls=[],fail=false;
 const reader=()=>create({same:()=>actor,ready:()=>ready,catalog,request:async path=>{calls.push(path);if(fail)throw Error('offline');return typeof reply==='function'?reply(path):reply;}});
 eq(await reader().read(()=>{}),{complete:true,records:0,pages:1,serverTime:2000});
 reply=path=>path.includes('?')?page([row(201)]):page(Array.from({length:200},(_,i)=>row(i+1)),id(200));let collected=[];
 eq((await reader().read(xs=>collected.push(...xs))).records,201);eq(calls.at(-1),'/learning-time?cursor='+id(200));eq(collected.length,201);eq(Object.keys(collected[0]).sort(),['acceptedAt','end','id','start','subject']);
 reply=page([row(1)]);await reject(()=>reader().read(()=>{actor=false;}));actor=true;ready=false;const before=calls.length;await reject(()=>reader().read(()=>{}));eq(calls.length,before);ready=true;
 fail=true;await reject(()=>reader().read(()=>{}));fail=false;
 for(const broken of [page([row(2),row(1)]),page([row(1),row(1)]),page([row(1)],id(1)),page([row(1)],'bad'),{items:[],serverTime:2000},page([{...row(1),acceptedAt:3000}]),page([{...row(1),spans:[{...row(1).spans[0],subject:'英語'}]}]),page([{...row(1),spans:[{...row(1).spans[0],end:5001}]}])]){reply=broken;await reject(()=>reader().read(()=>{}));}
 reply=page(Array.from({length:200},(_,i)=>row(i+1)),id(200));const bounded=create({same:()=>true,ready:()=>true,catalog,maxPages:1,request:async()=>reply});await reject(()=>bounded.read(()=>{}));
 reply=page([row(1)]);const single=reader();let release;const first=single.read(()=>new Promise(r=>{release=r;}));await new Promise(r=>setImmediate(r));await reject(()=>single.read(()=>{}));release();eq((await first).complete,true);eq((await single.read(()=>{})).records,1);
 let pages=0;const large=create({same:()=>true,ready:()=>true,catalog,request:async()=>{const offset=pages++*200;return page(Array.from({length:200},(_,i)=>row(offset+i+1)),pages===500?null:id(offset+200));}});let count=0;eq(await large.read(xs=>{count+=xs.length;}),{complete:true,records:100000,pages:500,serverTime:2000});eq(count,100000);
 console.log('Timeline history: '+checks+' checks passed; all 500 pages/100000 records, cursor validation, identity changes, offline failure, streaming bounds and private metadata exclusion; fake transport only');
})().catch(e=>{console.error(e);process.exitCode=1;});
