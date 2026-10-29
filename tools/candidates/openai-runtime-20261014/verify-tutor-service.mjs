import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {serveTutor} from './openai-tutor-service.mjs';
import {readFileSync} from 'node:fs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const bank=JSON.parse(readFileSync(new URL('../../../site-assets/material-bank.json',import.meta.url),'utf8'));
const now=Date.parse('2026-10-14T00:00:00Z'),unit=bank.units[0],q=unit.questions[0];
let calls=0,n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const envBase={SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-not-real',OPENAI_MONTHLY_LIMIT_YEN:'800'};
const fake=async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});return Response.json({status:'completed',model:JSON.parse(opts.body).model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({hints:['問題で指定された条件を確認しよう。','数の種類を整理してみよう。','選び忘れがないか確認しよう。']})}]}],usage:{input_tokens:100,output_tokens:50}});};
const db=new D1SQLite(),env={...envBase,AUTH_DB:db},options={requestId:'request_1',owner:'synthetic-owner',fetcher:fake,now},selection={unitId:unit.id,questionId:q.id};
for(const uid of ['p_free','p_mini','p_pro','p_unlimit']){db.seed('active-session:'+uid,'synthetic-owner',now+100000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));}
try{
 eq((await serveTutor({...env,OPENAI_BILLING_READY:'0'},{uid:'p_pro'},bank,'hint',selection,options)).error,'provider_not_ready');
 eq((await serveTutor(env,{uid:'p_pro'},bank,'hint',selection,{...options,owner:'other'})).error,'session_changed');
 eq((await serveTutor(env,{uid:'p_free'},bank,'hint',selection,options)).error,'plan_required');eq(calls,0);
 db.seed('openai-access:p_pro',JSON.stringify({version:'2026-10-14',ageBand:'under13',guardianConsent:true,approved:true}));
 eq((await serveTutor(env,{uid:'p_pro'},bank,'hint',selection,options)).error,'ai_consent_required');eq(calls,0);
 db.seed('openai-access:p_pro',JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));
 const r=await serveTutor(env,{uid:'p_pro'},bank,'hint',selection,options);
 eq(r.real,true);eq(r.model,'gpt-6-luna');eq(calls,3);eq((await planStatus(env,'p_pro',now)).aiUsed,1);
 const again=await serveTutor(env,{uid:'p_pro'},bank,'hint',selection,options);
 eq(again.cached,true);eq(again.value,r.value);eq(calls,3);eq((await planStatus(env,'p_pro',now)).aiUsed,1);eq((await trialStatus(db,now)).used,1);
 const u=await serveTutor(env,{uid:'p_unlimit'},bank,'hint',selection,options);
 eq(u.model,'gpt-6.1-sol');eq(calls,6);
 eq((await serveTutor(env,{uid:'p_pro'},bank,'hint',{...selection,questionId:unit.questions[1].id},options)).error,'id_conflict');eq(calls,6);
 eq((await serveTutor(env,{uid:'p_mini'},bank,'chat',selection,options)).error,'ai_unsupported');eq(calls,6);
}finally{db.close();}
console.log(`OpenAI tutor service candidate: ${n} isolated checks passed; real plan/gates/validators, fake provider only`);
