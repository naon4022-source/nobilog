import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {reserveOperation,startOperation,completeOperation} from './openai-receipts.mjs';
import {monthKey} from './openai-budget.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const env={OPENAI_MONTHLY_LIMIT_YEN:'800'},now=Date.parse('2026-10-14T00:00:00Z'),digest='a'.repeat(64);
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
let db=new D1SQLite();
try{
 const all=await Promise.all(Array.from({length:8},()=>reserveOperation(db,env,'p_pro','request_1',digest,100,now)));
 eq(db.get(monthKey(now)).v,'100');eq(all.every(x=>x.state==='reserved'),true);
 const starters=await Promise.all(all.map(x=>startOperation(db,'p_pro','request_1',x.token)));
 eq(starters.filter(Boolean).length,1);
 eq((await reserveOperation(db,env,'p_pro','request_1',digest,100,now)).state,'started');
 eq(db.get(monthKey(now)).v,'100');
 eq((await reserveOperation(db,env,'p_pro','request_1','b'.repeat(64),100,now)).error,'id_conflict');
 eq(await completeOperation(db,'p_pro','request_1',all[0].token,{answer:'Synthetic result'}),true);
 eq((await reserveOperation(db,env,'p_pro','request_1',digest,100,now)).value,{answer:'Synthetic result'});
 eq(await startOperation(db,'p_pro','request_1',all[0].token),false);
 eq(await completeOperation(db,'p_unlimit','request_1',all[0].token,{answer:'Other'}),false);
 eq(db.get(monthKey(now)).v,'100');
}finally{db.close();}
// A lost transaction reply must not cause a second reservation.
db=new D1SQLite();try{
 const batch=db.batch.bind(db);let lost=true;
 db.batch=async x=>{const result=await batch(x);if(lost){lost=false;throw Error('Synthetic lost response');}return result;};
 await assert.rejects(reserveOperation(db,env,'p_pro','request_2',digest,100,now));n++;
 const retry=await reserveOperation(db,env,'p_pro','request_2',digest,100,now);
 eq(retry.state,'reserved');eq(db.get(monthKey(now)).v,'100');
 eq(await startOperation(db,'p_pro','request_2',retry.token),true);
 eq(await startOperation(db,'p_pro','request_2',retry.token),false);
}finally{db.close();}
// Budget and journal must both roll back if any transaction statement fails.
for(const failAt of [0,1]){db=new D1SQLite();try{
 db.failBatchAt=failAt;
 await assert.rejects(reserveOperation(db,env,'p_pro','request_3',digest,100,now));n++;
 eq(db.keys(),[]);
}finally{db.close();}}
for(const bad of ['oops','-1','1.0','9000000000000']){db=new D1SQLite();try{
 db.seed(monthKey(now),bad);
 eq((await reserveOperation(db,env,'p_pro','request_4',digest,100,now)).error,'ai_budget');
 eq(db.get(monthKey(now)).v,bad);eq(db.keys().length,1);
}finally{db.close();}}
db=new D1SQLite();try{
 const all=await Promise.all(Array.from({length:12},(_,i)=>reserveOperation(db,env,i%2?'p_pro':'p_unlimit','request_'+i,digest,100000000,now)));
 eq(all.filter(x=>x.state==='reserved').length,8);eq(db.get(monthKey(now)).v,'800000000');
 eq(all.filter(x=>x.error==='ai_budget').length,4);
}finally{db.close();}
console.log(`OpenAI receipt candidate: ${n} isolated checks passed; no API, keys, user data or runtime import`);
