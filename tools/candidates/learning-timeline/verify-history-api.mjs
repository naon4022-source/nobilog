import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {route} from '../../../cf-worker/src/learning-time.mjs';
const require=createRequire(import.meta.url),{D1SQLite}=require('../../../.claude/verify/d1-sqlite.js'),{create}=require('./history.cjs'),{aggregate}=require('./aggregate.cjs');
const db=new D1SQLite(),origin='https://synthetic.test',now=Date.parse('2026-10-15T03:00:00Z'),base=Date.parse('2026-10-13T14:59:59Z');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),catalog=[{id:'textbook:math1',subject:'数学',kind:'textbook'}];
let n=0,same=true,calls=0,owner='owner-a',uid='synthetic-a',revoke=false;
const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
db.seed('active-session:synthetic-a','owner-a',now+86400000);db.seed('active-session:synthetic-b','owner-b',now+86400000);
for(let i=1;i<=401;i++){
 const item={id:id(i),acceptedAt:now-100,content:'private storage field',spans:[{id:id(i)+':0',activity:'textbook:math1',subject:'数学',kind:'textbook',start:base+(i-1)*1000,end:base+i*1000,acceptedAt:now-100}]};
 db.seed('learning-time:synthetic-a:'+item.id,JSON.stringify(item),0);
}
const reader=()=>create({same:()=>same,ready:()=>true,catalog,request:async path=>{
 calls++;const r=await route(new Request(origin+path),{AUTH_DB:db},{uid},{owner,catalog,now});
 if(!r.ok)throw Error('history HTTP '+r.status);
 const body=await r.json();if(revoke&&calls===1)db.seed('active-session:synthetic-a','replacement-owner',now+86400000);return body;
}});
try{
 const spans=[];eq(await reader().read(xs=>spans.push(...xs)),{complete:true,records:401,pages:3,serverTime:now});eq(calls,3);eq(spans.length,401);
 const days=aggregate(spans);eq(days['2026-10-13']['数学'],1000);eq(days['2026-10-14']['数学'],400000);eq(Object.values(days).flatMap(Object.values).reduce((a,b)=>a+b,0),401000);eq('content' in spans[0],false);
 uid='synthetic-b';owner='owner-b';eq((await reader().read(()=>{throw Error('other user has no spans');}).catch(e=>e)).message,'other user has no spans');
 const other=[];eq((await reader().read(xs=>other.push(...xs))).records,0);eq(other.length,0);
 uid='synthetic-a';owner='owner-a';calls=0;revoke=true;let completed=false;await assert.rejects(async()=>{await reader().read(()=>{});completed=true;});n++;eq(completed,false);eq(calls,2);
 console.log('Timeline history/API: '+n+' checks passed; 401 records across real SQLite pages, JST midnight, owner isolation, revocation between pages and no false completion; no external network');
}finally{db.close();}
