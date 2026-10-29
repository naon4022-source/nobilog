import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {serveTextChat} from './service.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const now=Date.now(),day=new Date(now+32400000).toISOString().slice(0,10);
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
for(const mode of ['daily','stopped','corrupt','plan']){
 const db=new D1SQLite();let calls=0;
 try{
  const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic',OPENAI_MONTHLY_LIMIT_YEN:'800'};
  db.seed('active-session:p_pro','owner',now+60000);db.seed('openai-access:p_pro',JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
  if(mode==='daily')db.seed('ai-trial:day:'+day,'10');
  if(mode==='stopped')db.seed('ai-trial:failures','3');
  if(mode==='corrupt')db.seed('ai-trial:day:'+day,'invalid');
  if(mode==='plan'){const status=await planStatus(env,'p_pro',now);db.seed('plan-ai:p_pro:'+status.periodFrom,'300');}
  const result=await serveTextChat(env,{uid:'p_pro'},{text:'Synthetic question',images:[]},{owner:'owner',requestId:'request_1',now,fetcher:async()=>{calls++;throw Error('must not call');}});
  eq(result.error,mode==='plan'?'ai_plan':mode==='stopped'?'ai_stopped':'ai_trial_daily');
  eq(calls,0);eq(db.keys().filter(k=>k.startsWith('openai-chat-context:')).length,0);
  eq(db.keys().filter(k=>k.startsWith('openai-operation:')).length,0);
 }finally{db.close();}
}
console.log(`AI pre-context gates candidate: ${n} checks passed; exhausted quota, daily trial, stop latch and corrupt counters reject before snapshot writes or API`);
