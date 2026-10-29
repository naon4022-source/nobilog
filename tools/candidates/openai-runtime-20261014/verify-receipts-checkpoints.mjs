import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {reserveOperation,startOperation,completeOperation} from './openai-receipts.mjs';
import {monthKey} from './openai-budget.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const env={OPENAI_MONTHLY_LIMIT_YEN:'800'},now=Date.parse('2026-10-14T00:00:00Z'),hash='a'.repeat(64);
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
for(const phase of ['started','done']){
 const db=new D1SQLite();try{
  const r=await reserveOperation(db,env,'p_pro','request_x',hash,100,now);
  if(phase==='done')eq(await startOperation(db,'p_pro','request_x',r.token),true);
  const prepare=db.prepare.bind(db);let lost=true;
  db.prepare=sql=>{
   const stmt=prepare(sql);
   if(sql.startsWith('UPDATE auth_kv SET v=json_set')){
    const bind=stmt.bind.bind(stmt);
    stmt.bind=(...args)=>{const bound=bind(...args),first=bound.first.bind(bound);
     bound.first=async(...a)=>{const v=await first(...a);if(lost){lost=false;throw Error('Lost checkpoint reply');}return v;};return bound;};
   }return stmt;
  };
  await assert.rejects(phase==='started'?startOperation(db,'p_pro','request_x',r.token):completeOperation(db,'p_pro','request_x',r.token,{answer:'Synthetic'}));n++;
  const retry=await reserveOperation(db,env,'p_pro','request_x',hash,100,now);
  eq(retry.state,phase);eq(await startOperation(db,'p_pro','request_x',r.token),false);
  eq(db.get(monthKey(now)).v,'100');
  if(phase==='done')eq(retry.value,{answer:'Synthetic'});
 }finally{db.close();}
}
console.log(`Lost OpenAI checkpoints: ${n} isolated checks passed; retry never starts a second paid operation`);
