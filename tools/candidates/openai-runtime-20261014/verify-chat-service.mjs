import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {serveTextChat} from './openai-tutor-service.mjs';
import {planStatus} from '../../../cf-worker/src/plans.mjs';
import {trialStatus} from '../../../cf-worker/src/ai-trial-control.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const db=new D1SQLite(),now=Date.now();
const env={AUTH_DB:db,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'synthetic-only',OPENAI_MONTHLY_LIMIT_YEN:'800'};
for(const uid of ['p_standard','p_pro','p_unlimit']){db.seed('active-session:'+uid,'test-owner',now+60000);db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'13-17',guardianConsent:true,approved:true}));}
let n=0,calls=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const options={requestId:'request_1',owner:'test-owner',now,fetcher:async(url,opts)=>{
 calls++;
 if(url.endsWith('moderations'))return Response.json({results:[{flagged:false}]});
 const body=JSON.parse(opts.body);
 assert.equal(Object.hasOwn(body,'tools'),false);assert.equal(body.input.includes('PRIVATE_TEST'),false);
 return Response.json({status:'completed',model:body.model,output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{"answer":"Synthetic learning explanation."}'}]}],usage:{input_tokens:100,output_tokens:20}});
}};
const body={text:'Please explain negative numbers.',images:[],uid:'PRIVATE_TEST_UID',model:'PRIVATE_TEST_MODEL'};
try{
 eq((await serveTextChat(env,{uid:'p_standard'},body,options)).error,'plan_required');eq(calls,0);
 const pro=await serveTextChat(env,{uid:'p_pro'},body,options);
 eq(pro.real,true);eq(pro.model,'gpt-6-luna');eq(pro.value,{answer:'Synthetic learning explanation.'});eq(calls,3);eq((await planStatus(env,'p_pro',now)).aiUsed,1);
 const retry=await serveTextChat(env,{uid:'p_pro'},body,options);
 eq(retry.cached,true);eq(calls,3);eq((await planStatus(env,'p_pro',now)).aiUsed,1);eq((await trialStatus(db,now)).used,1);
 const unlimit=await serveTextChat(env,{uid:'p_unlimit'},body,options);
 eq(unlimit.model,'gpt-6.1-sol');eq(calls,6);
 eq((await serveTextChat(env,{uid:'p_pro'},{...body,text:'Changed question'},options)).error,'id_conflict');eq(calls,6);
 eq((await serveTextChat(env,{uid:'p_pro'},{text:'Read this image',images:['fake-id']},{...options,requestId:'request_2'})).error,'ai_unsupported');eq(calls,6);
 eq((await serveTextChat({...env,OPENAI_BILLING_READY:'0'},{uid:'p_pro'},body,options)).error,'provider_not_ready');eq(calls,6);
 eq((await serveTextChat(env,{uid:'p_pro'},body,{...options,owner:'new-owner'})).error,'session_changed');eq(calls,6);
}finally{db.close();}
console.log(`OpenAI text chat service: ${n} isolated checks passed; plan routing, paid save/replay, strict source extraction, no network`);
