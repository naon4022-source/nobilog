// Exercise every new practice via actual owned, completed test-review HTTP routes.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import bank from '../../../../cf-worker/src/material-bank.mjs';
import data from '../../../../cf-worker/src/ai-review-practice-data.mjs';
import shipped from './before/cf-worker/src/ai-review-practice-data.mjs';
import {createTestSession} from '../../../../cf-worker/src/ai-test-session.mjs';
import {admitTestReview,processTestReviewMessage} from '../../../../cf-worker/src/ai-test-review-service.mjs';
import {finishedTestReviewResult} from '../../../../cf-worker/src/ai-test-review-jobs.mjs';
import {reviewPracticeRoute} from '../../../../cf-worker/src/ai-review-practice-route.mjs';
const {D1SQLite}=createRequire(import.meta.url)('../../../../.claude/verify/d1-sqlite.js');
const root=new URL('../../../../',import.meta.url),here=new URL('./',import.meta.url),oldIds=new Set(shipped.questions.map(q=>q.id)),added=data.questions.filter(q=>!oldIds.has(q.id)),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(added.length,48);let checks=0,outside=0;const rows=[];const equal=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
const savedFetch=globalThis.fetch;globalThis.fetch=()=>{outside++;throw Error('unexpected external request');};
try{
 for(const [index,q] of added.entries()){
  const unit=bank.units.find(u=>(u.tests||[]).some(s=>q.appliesToSourceIds.includes(s.id)));assert(unit,'actual server-bank test source '+q.id);
  const source=unit.tests.find(s=>q.appliesToSourceIds.includes(s.id)),selected=[source,...unit.tests.filter(s=>s.id!==source.id)].slice(0,5);assert.equal(selected.length,5);
  const uid=['u1','u2','u4'][index%3],plan=index%2?'unlimit':'pro',db=new D1SQLite(),now=Date.now(),owner='synthetic-new-practice-owner',queue=[];let generated=0;
  try{
   db.seed('active-session:'+uid,owner,now+3600000);db.seed('plan:'+uid,JSON.stringify({plan,start:now-86400000,end:now+30*86400000,next:null,revision:2,initializedAt:now-86400000}));db.seed('openai-access:'+uid,JSON.stringify({version:'2026-10-14',approved:true,ageBand:'13-17',guardianConsent:true}));db.seed('material-history:'+uid+':sentinel','synthetic-original-grades');
   const env={AUTH_DB:db,APP_ORIGIN:'https://fixture.invalid',SUBSCRIPTION_PREVIEW:'1',PLAN_CREDITS_V2:'1',OPENAI_MONTHLY_LIMIT_YEN:'800',AI_TEST_REVIEW_ENABLED:'1',OPENAI_ENABLED:'1',OPENAI_TRIAL_ONLY:'1',OPENAI_SAFETY_READY:'1',OPENAI_TERMS_READY:'1',OPENAI_BILLING_READY:'1',OPENAI_API_KEY:'fixture-only-not-a-real-key',AI_TEST_REVIEW_QUEUE:{send:async m=>queue.push(m)}};
   const roster=await createTestSession(env,uid,{id:crypto.randomUUID(),unitId:unit.id,mode:'test',questionIds:selected.map(s=>s.id)},{owner,now});
   for(const slot of roster.slots){const s=selected.find(s=>s.id===slot.questionId);assert(s);db.seed('material-attempt:'+uid+':'+slot.attemptId,JSON.stringify({id:slot.attemptId,unitId:unit.id,questionId:slot.questionId,mode:'test',at:now+1,answer:'synthetic wrong',prompt:s.prompt,expected:s.answer,result:{correct:false}}));}
   const admitted=await admitTestReview(env,{uid},{id:crypto.randomUUID(),testSessionId:roster.id},{owner,now:Date.now()});assert(!admitted.error,JSON.stringify({id:q.id,admitted}));
   const fetcher=async(url,options)=>{if(url.endsWith('/moderations'))return Response.json({results:[{flagged:false}]});assert.equal(url,'https://api.openai.com/v1/responses');generated++;const body=JSON.parse(options.body),input=JSON.parse(body.input);return Response.json({status:'completed',model:body.model,service_tier:'default',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({items:input.questions.map(s=>{const id=s.questionId===source.id?q.id:s.practices[0]?.id||null;if(s.questionId===source.id)assert(s.practices.some(p=>p.id===q.id),'actual job offers intended new practice '+q.id);return {questionId:s.questionId,comment:'選んだ理由を見直し、同じ考え方を別の問題で確かめよう。',purpose:'まちがえた理由の確認',practiceId:id};})})}]}],usage:{input_tokens:100,output_tokens:100}});};
   while(queue.length){const result=await processTestReviewMessage(env,queue.shift(),{now:Date.now(),fetcher,canRun:async()=>true});equal(result.job?.state,'done','actual synthetic review completes '+q.id);}
   const review=await finishedTestReviewResult(env,uid,roster.id,{owner,now:Date.now()}),item=review.items.find(i=>i.questionId===source.id);equal(item.practiceId,q.id,'exact new practice selected by owned completed review');
   const selection={jobId:review.job.id,questionId:source.id,practiceId:q.id};
   const call=async(params=selection,{method='GET',actor=uid,activeOwner=owner,origin=env.APP_ORIGIN}={})=>{const request=new Request(env.APP_ORIGIN+'/material-test-review/practice'+(method==='GET'?'?'+new URLSearchParams(params):''),{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(params)}:{})});const response=await reviewPracticeRoute(request,env,{uid:actor},{owner:activeOwner});return {response,value:await response.json()};};
   const quota=()=>JSON.stringify(db.keys().filter(k=>/^(?:plan-credit|plan-quota|ai-test-review-credit|ai-trial)/.test(k)).sort().map(k=>[k,db.get(k).v])),before=quota(),calls=generated;
   const get=await call();equal(get.response.status,200,'new linked public problem opens');equal(get.response.headers.get('Cache-Control'),'private, no-store','private response uncached');equal(get.value.question,{id:q.id,type:q.type,prompt:q.prompt},'only current prompt/type/id before answering');
   for(const answer of 'アイウ'){
    const body={...selection,id:crypto.randomUUID(),answer},graded=await call(body,{method:'POST'});equal(graded.response.status,200,'actual new practice HTTP grade');equal(graded.value.result.correct,q.answer.accepted.includes(answer),'exactly intended choice is correct');equal(graded.value.result.explanation,q.explanation,'current clarified feedback');
    const repeat=await call(body,{method:'POST'});equal(repeat.response.status,200,'same receipt retry');equal(repeat.value.cached,true,'idempotent same receipt');
   }
   equal(db.keys().filter(k=>k.startsWith('ai-review-practice-attempt:'+uid+':')).length,3,'six submissions save only3 attempts');
   equal((await call(selection,{actor:uid==='u4'?'u1':'u4'})).response.status,409,'other account closed');equal((await call(selection,{activeOwner:'different-owner'})).response.status,409,'stale owner closed');equal((await call({...selection,id:crypto.randomUUID(),answer:'ア'},{method:'POST',origin:'https://other.invalid'})).response.status,403,'wrong origin closed');
   equal(quota(),before,'practice does not charge extra AI credits');equal(generated,calls,'practice does not generate extra model calls');equal(generated,1,'one synthetic all-question review');equal(db.get('material-history:'+uid+':sentinel').v,'synthetic-original-grades','ordinary grades unchanged');
   env.OPENAI_ENABLED='0';db.seed('plan:'+uid,JSON.stringify({plan:'free',start:Date.now()-1000,end:null,next:null,revision:3}));equal((await call()).response.status,200,'owned completed practice retained after downgrade');
   rows.push({id:q.id,sourceId:source.id,unitId:unit.id,uid,plan,answer:q.answer.accepted[0],expectedReceiptCount:3,extraModelCalls:0});
  }finally{db.close();}
 }
 equal(rows.length,48,'all new48 actual HTTP cases');equal(outside,0,'zero real external requests');
 const inputs=[];for(const file of ['cf-worker/src/ai-review-practice-route.mjs','cf-worker/src/ai-review-practice-library.mjs','cf-worker/src/ai-review-practice-data.mjs','cf-worker/src/ai-test-session.mjs','cf-worker/src/ai-test-review-service.mjs','cf-worker/src/ai-test-review-jobs.mjs'])inputs.push({file,sha256:sha(await readFile(new URL(file,root)))});
 await writeFile(new URL('route-result.json',here),JSON.stringify({status:'passed',checks,newQuestions:48,rows,inputs,outside,scope:'Every new48 via actual test-session→completed owned review→exact selected practice→private HTTP/SQLite answer/retry.3 synthetic owners and Pro/Unlimited; no answer before submit, correct choice and clarified feedback, idempotency, owner/Origin refusal, zero extra AI charges/model calls, unchanged grade sentinel, retained owned practice after Free downgrade. Fake provider only; no real users/AI.'},null,2)+'\n');console.log('New48 actual owned practice routes: '+checks+' checks passed.');
}finally{globalThis.fetch=savedFetch;}
