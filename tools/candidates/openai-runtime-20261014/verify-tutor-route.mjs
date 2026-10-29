import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {geminiTutorRoute} from './gemini-dispatch.mjs';
import {openaiTutorRoute} from './openai-tutor-route.mjs';
import {materialRecordsRoute} from '../../../cf-worker/src/material-records.mjs';
import bank from '../../../cf-worker/src/material-bank.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),now=Date.now(),origin='https://fixture.test',unit=bank.units[0],q=unit.questions[0];
const env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
for(const uid of ['p_free','p_mini','p_standard','p_pro','p_unlimit']){db.seed('active-session:'+uid,'test-owner',now+60000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));}
let n=0,calls=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const fetchImpl=async(url,opts)=>{calls++;if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});const input=JSON.parse(JSON.parse(opts.body).input);const value=Object.hasOwn(input,'learnerAnswer')?{reason:'Synthetic reason',steps:['First step','Second step'],tip:'Synthetic tip'}:{hints:['問題の条件を確認しよう。','数の種類を整理しよう。','選び忘れを確認しよう。']};return Response.json({status:'completed',model:JSON.parse(opts.body).model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(value)}]}],usage:{input_tokens:100,output_tokens:20}});};
const helpers={owner:'test-owner',fetchImpl,now};
async function call(uid,path,body,requestOrigin=origin){const r=await openaiTutorRoute(new Request(origin+path,{method:body?'POST':'GET',headers:{Origin:requestOrigin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,{uid},helpers);return {status:r.status,json:await r.json()};}
const hint=level=>({unitId:unit.id,questionId:q.id,level});
try{
 eq((await call('p_free','/material-ai-status')).json.available,false);
 eq((await call('p_mini','/material-ai-status')).json.available,true);
 eq((await call('p_mini','/material-ai-status')).json.features.weakness,false);
 eq((await call('p_mini','/material-hint',hint(2))).json.error,'hint_order');eq(calls,0);
 eq((await call('p_mini','/material-hint',hint(1),'https://other.test')).status,403);eq(calls,0);
 let r=await call('p_mini','/material-hint',hint(1));eq(r.status,200);eq(r.json.model,'gpt-6-luna');eq(calls,3);
 r=await call('p_mini','/material-hint',hint(1));eq(r.json.cached,true);eq(calls,3);
 eq((await call('p_mini','/material-hint',hint(3))).json.error,'hint_order');
 eq((await call('p_mini','/material-hint',hint(2))).status,200);eq(calls,3);
 eq((await call('p_mini','/material-hint',hint(3))).json.more,false);eq(calls,3);
 eq((await planStatus(env,'p_mini',now)).aiUsed,1);eq((await trialStatus(db,now)).used,1);
 r=await call('p_unlimit','/material-hint',hint(1));eq(r.json.model,'gpt-6.1-sol');eq(calls,6);
 const id=randomUUID();const stored=await materialRecordsRoute(new Request(origin+'/material-records',{method:'POST',body:JSON.stringify({id,unitId:unit.id,questionId:q.id,mode:'study',answer:'777',elapsedMs:1000})}),env,{uid:'p_standard'},{owner:'test-owner',json:(v,s=200)=>Response.json(v,{status:s}),requestJson:r=>r.json(),invalidBody:()=>Response.json({error:'body'},{status:400})});
 eq(stored.status,200);const before=db.get('material-attempt:p_standard:'+id).v;
 r=await call('p_standard','/material-explain',{attemptId:id});eq(r.status,200);eq(r.json.model,'gpt-6-luna');eq(calls,9);
 eq(db.get('material-attempt:p_standard:'+id).v,before);
 r=await call('p_standard','/material-explain',{attemptId:id});eq(r.json.cached,true);eq(calls,9);
 eq((await call('p_pro','/material-explain',{attemptId:id})).status,404);eq(calls,9);
 eq((await call('p_mini','/material-hint',{...hint(1),model:'client-model'})).status,400);
 eq((await call('p_mini','/material-generate',{unitId:unit.id,count:1})).status,422);eq(calls,9);
 const throughHelpers={...helpers,json:(v,s=200)=>Response.json(v,{status:s}),requestJson:r=>r.json(),invalidBody:()=>Response.json({error:'body'},{status:400})};
 let through=await geminiTutorRoute(new Request(origin+'/material-ai-status'),env,{uid:'p_mini'},throughHelpers);
 eq((await through.json()).provider,'openai');eq(calls,9);
 through=await geminiTutorRoute(new Request(origin+'/material-hint',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(hint(1))}),env,{uid:'p_mini'},throughHelpers);
 eq(through.status,200);eq((await through.json()).cached,true);eq(calls,9);
 through=await geminiTutorRoute(new Request(origin+'/material-judge',{method:'POST',body:'{}'}),env,{uid:'p_pro'},throughHelpers);
 eq(through.status,422);eq(calls,9);
 const activities=db.keys().filter(k=>k.startsWith('activity:p_mini:')).map(k=>JSON.parse(db.get(k).v));
 eq(activities.length,5);eq(activities.every(x=>x.type==='hint'&&x.mock===false&&!Object.hasOwn(x,'answer')),true);
 // A step/log batch failure does not undo a completed paid response. Replay
 // recovers the response and only writes the missing step/log transaction.
 db.failBatchAt=1;
 eq((await call('p_mini','/material-hint',hint(1))).status,503);eq(calls,9);
 eq(db.keys().filter(k=>k.startsWith('activity:p_mini:')).length,5);
 db.failBatchAt=-1;
 eq((await call('p_mini','/material-hint',hint(1))).status,200);eq(calls,9);

}finally{db.close();}
console.log(`OpenAI tutor API candidate: ${n} isolated checks passed; original request shape, ordered/cached hints, own attempts, immutable grades, no network`);
