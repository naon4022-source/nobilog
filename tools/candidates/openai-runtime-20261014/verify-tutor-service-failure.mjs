import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {serveTutor} from './openai-tutor-service.mjs';
import bank from '../../../cf-worker/src/material-bank.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const now=Date.now(),selection={unitId:bank.units[0].id,questionId:bank.units[0].questions[0].id};
const base={SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
function setup(){const db=new D1SQLite();db.seed('active-session:p_pro','test-owner',now+60000);db.seed('openai-access:p_pro',JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));return {db,env:{...base,AUTH_DB:db}};}
for(const scenario of ['invalid','split-hints','lost-save','account-change','lease-expiry']){
 const {db,env}=setup();let calls=0,lost=true;
 try{
  if(scenario==='lost-save'){
   const prepare=db.prepare.bind(db);
   db.prepare=sql=>{const s=prepare(sql);if(sql.includes("'$.state','done'")){const bind=s.bind.bind(s);s.bind=(...args)=>{const b=bind(...args),first=b.first.bind(b);b.first=async(...a)=>{const r=await first(...a);if(lost){lost=false;throw Error('Synthetic lost save reply');}return r;};return b;};}return s;};
  }
  const options={requestId:'request_1',owner:'test-owner',now,fetcher:async(url,opts)=>{
   calls++;if(scenario==='lease-expiry'&&calls===1){db.seed('active-session:p_pro','test-owner',now+10);await new Promise(r=>setTimeout(r,25));}if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
   if(scenario==='account-change')db.seed('active-session:p_pro','new-owner',now+60000);
   const hints=scenario==='split-hints'?['8 and -3','10','0']:scenario==='invalid'?['Answer is 8.','answer','answer']:['問題の条件を確認しよう。','数の種類を整理しよう。','選び忘れを確認しよう。'];
   return Response.json({status:'completed',model:JSON.parse(opts.body).model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({hints})}]}],usage:{input_tokens:100,output_tokens:20}});
  }};
  const r=await serveTutor(env,{uid:'p_pro'},bank,'hint',selection,options);
  eq(!!r.error,true);const before=calls;
  const retry=await serveTutor(env,{uid:'p_pro'},bank,'hint',selection,scenario==='lease-expiry'?{...options,now:Date.now()}:options);
  eq(calls,before);
  if(scenario==='lost-save'){eq(retry.cached,true);eq((await planStatus(env,'p_pro',now)).aiUsed,1);}
  else if(scenario==='account-change'||scenario==='lease-expiry'){eq(retry.error,'session_changed');eq((await planStatus(env,'p_pro',now)).aiUsed,0);}
  else{eq(retry.error,'request_outcome_unknown');eq((await planStatus(env,'p_pro',now)).aiUsed,0);}
 }finally{db.close();}
}
console.log(`OpenAI service failure candidate: ${n} checks passed; invalid hints, lost-save recovery, account switch, no paid replay`);
