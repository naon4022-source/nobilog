// Parent dispatch, actual chat/status controller and isolated SQLite; no paid calls.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {learningAssistantRoute as before} from '../../../cf-worker/src/learning-assistant.mjs';
import {learningAssistantRoute as candidate} from './view/cf-worker/src/learning-assistant.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../.claude/verify/d1-sqlite.js');
const now=Date.now(),origin='https://fixture.invalid',db=new D1SQLite();
let checks=0,external=0,historyReads=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const env={AUTH_DB:db,APP_ORIGIN:origin,SUBSCRIPTION_PREVIEW:'1',PREVIEW_PLAN_ACCOUNTS:'1',PLAN_CREDITS_V2:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'fixture-only',OPENAI_MONTHLY_LIMIT_YEN:'800',GEMINI_ENABLED:'0',GEMINI_MOCK:'1'};
for(const [uid,plan]of [['p_pro','pro'],['p_unlimit','unlimit'],['p_free','free']]){
 db.seed('active-session:'+uid,'synthetic-owner',now+3600000);
 db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',ageBand:'adult',approved:true}));
 db.seed('plan:'+uid,JSON.stringify({plan,start:now-86400000,end:now+30*86400000,next:null,revision:1,initializedAt:now-86400000}));
}
const prepare=db.prepare.bind(db);
db.prepare=sql=>{if(sql==='SELECT v FROM auth_kv WHERE k>=? AND k<? ORDER BY k LIMIT 100'){historyReads++;throw Error('status must not read transcripts');}return prepare(sql);};
const savedFetch=globalThis.fetch;globalThis.fetch=()=>{external++;throw Error('no live calls');};
async function call({route=candidate,path='/learning-chat?status=1',method='GET',uid='p_pro',owner='synthetic-owner',overrides={}}={}){
 const r=await route(new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{})}),{...env,...overrides},{uid},{owner,fetchImpl:globalThis.fetch});
 return {status:r.status,value:await r.json()};
}
try{
 eq((await call({route:before})).value.error,'invalid_query','reproduce deployed parent rejection');
 for(const uid of ['p_pro','p_unlimit']){
  const r=await call({uid});eq(r.status,200,'actual parent forwards exact read-only status');eq(r.value.provider,'openai');eq(r.value.ready,true);eq(Object.hasOwn(r.value,'items'),false,'no history response');eq(r.value.trial.limit,10);eq(r.value.trial.used,0);
 }
 for(const path of ['/learning-chat?status=0','/learning-chat?status=1&extra=1','/learning-chat?status=1&status=1','/learning-notes?status=1'])eq((await call({path})).value.error,'invalid_query','query scope unchanged');
 eq((await call({method:'POST'})).value.error,'invalid_query','POST cannot use status exception');
 eq((await call({overrides:{OPENAI_ENABLED:'0'}})).value.error,'invalid_query','legacy mock does not gain new queries');
 eq((await call({owner:''})).status,401,'owner still required');
 eq((await call({owner:'different'})).status,409,'stale owner still closed');
 eq((await call({uid:'p_free'})).status,403,'Free still closed');
 for(const [overrides,reason]of [[{OPENAI_API_KEY:''},'setup_required'],[{OPENAI_BILLING_READY:'0'},'billing_required'],[{GEMINI_ENABLED:'1'},'provider_conflict']]){
  const r=await call({overrides});eq(r.status,200);eq(r.value.ready,false);eq(r.value.connection.reason,reason);eq(Object.hasOwn(r.value,'items'),false);
 }
 const day=new Date(Date.now()+32400000).toISOString().slice(0,10);
 db.seed('ai-trial:day:'+day,'10');let r=await call();eq(r.value.connection.reason,'daily_limit');eq(r.value.ready,false);eq(r.value.trial.used,10);
 db.seed('ai-trial:failures','3');r=await call();eq(r.value.connection.reason,'stopped');eq(r.value.ready,false);
 eq(historyReads,0,'no transcript SQL');eq(external,0,'no provider/network calls');
 const sha=b=>createHash('sha256').update(b).digest('hex');
 const result={status:'passed isolated parent/status regression; real API trial pending',checks,historyReads,external,realAPICalls:0,inputs:[{file:'cf-worker/src/learning-assistant.mjs',sha256:sha(await readFile(new URL('../../../cf-worker/src/learning-assistant.mjs',import.meta.url)))},{file:'learning-assistant.candidate.mjs',sha256:sha(await readFile(new URL('learning-assistant.candidate.mjs',import.meta.url)))}],scope:'Exact GET status exception through actual parent/controller; Pro/Unlimited, no transcript SQL, unchanged unknown/duplicate/POST/mock query refusal, owner/Free/billing/key/provider conflict/daily10/circuit gates. No deployment, real key, real learner records or paid API.'};
 await writeFile(new URL('result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log('Parent status-query regression: '+checks+' checks passed; real calls0.');
}finally{globalThis.fetch=savedFetch;db.close();}
