import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {route} from '../../../cf-worker/src/learning-time.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{create}=require('./collector.cjs'),{aggregate}=require('./aggregate.cjs');
const db=new D1SQLite(),base=Date.parse('2026-10-13T14:59:59Z'),origin='https://fixture.test',sid='00000000-0000-4000-8000-000000000001';
let now=base,serial=0,n=0,same=true,loseReply=true,calls=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;},catalog=[{id:'textbook:math1',subject:'数学',kind:'textbook'},{id:'question:synthetic-unit',subject:'理科',kind:'question'}];
db.seed('active-session:synthetic-a','owner-a',base+8*86400000);db.seed('active-session:synthetic-b','owner-b',base+8*86400000);
const http=(path,body,uid='synthetic-a',owner='owner-a')=>route(new Request(origin+path,body===undefined?{}:{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}),{AUTH_DB:db},{uid},{owner,catalog,now});
const rows=new Map(),storage={async put(uid,p){const k=uid+':'+p.id,prior=rows.get(k);if(prior)assert.deepEqual(prior,p);else rows.set(k,structuredClone(p));},async list(uid,limit){return [...rows].filter(([k])=>k.startsWith(uid+':')).slice(0,limit).map(([,p])=>structuredClone(p));},async remove(uid,p){assert.deepEqual(rows.get(uid+':'+p.id),p);rows.delete(uid+':'+p.id);}};
const options={uid:'synthetic-a',sessionId:sid,origin:0,same:()=>same,storage,catalog:catalog.map(x=>x.id),newId:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,send:async payload=>{calls++;const r=await http('/learning-time',payload);if(!r.ok)throw Error('save failed');const receipt=await r.json();if(loseReply){loseReply=false;throw Error('lost reply after commit');}return receipt;}};
try{
 const start=await http('/learning-time-start',{id:sid});eq(start.status,200);eq((await start.json()).session.startedAt,base);
 let c=create(options);c.sample(0,'textbook:math1',{visible:true,focused:true});c.sample(2000,'textbook:math1',{visible:true,focused:true});now=base+2000;
 eq(!!(await c.flush()).error,true);eq(rows.size,1);eq(db.keys().filter(k=>k.startsWith('learning-time:synthetic-a:')).length,1);
 // Simulate a new collector after page restart using the same durable queue.
 c=create(options);eq((await c.flush()).sent,1);eq(rows.size,0);eq(calls,2);eq(db.keys().filter(k=>k.startsWith('learning-time:synthetic-a:')).length,1);
 const saved=await(await http('/learning-time')).json(),days=aggregate(saved.items.flatMap(x=>x.spans));
 eq(days['2026-10-13']['数学'],1000);eq(days['2026-10-14']['数学'],1000);
 eq((await(await http('/learning-time',undefined,'synthetic-b','owner-b')).json()).items.length,0);
 c.sample(2000,'question:synthetic-unit',{visible:true,focused:true});c.sample(3000,'question:synthetic-unit',{visible:true,focused:true});now=base+3000;eq((await c.flush()).sent,1);
 const total=aggregate((await(await http('/learning-time')).json()).items.flatMap(x=>x.spans));eq(total['2026-10-14']['理科'],1000);
 same=false;eq(c.sample(4000,'textbook:math1',{visible:true,focused:true}),false);eq((await c.flush()).stopped,true);eq(calls,3);
 console.log(`Timeline collector/API: ${n} checks passed; real isolated SQLite, committed reply loss, reload queue, same-ID replay, no duplicate duration, JST midnight, subjects and owner isolation`);
}finally{db.close();}
